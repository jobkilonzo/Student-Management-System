import db from "../../database/mysql_database.js";

const sumPaymentsBetween = async (from, to) => {
  const [rows] = await db.execute(
    `
    SELECT COALESCE(SUM(amount_paid), 0) AS total
    FROM fee_payments
    WHERE payment_date >= ? AND payment_date < ?
    `,
    [from, to]
  );
  return Number(rows?.[0]?.total || 0);
};

export const getDashboard = async (_req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfWeek = new Date(startOfToday);
    // Monday as start of week
    const day = (startOfWeek.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

    const startOfMonth = new Date(startOfToday);
    startOfMonth.setDate(1);

    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);

    const [todayTotal, weekTotal, monthTotal] = await Promise.all([
      sumPaymentsBetween(startOfToday, startOfTomorrow),
      sumPaymentsBetween(startOfWeek, startOfNextWeek),
      sumPaymentsBetween(startOfMonth, startOfNextMonth),
    ]);

    const [outstandingRows] = await db.execute(
      "SELECT COALESCE(SUM(balance), 0) AS outstanding FROM student_balances"
    );
    const outstanding = Number(outstandingRows?.[0]?.outstanding || 0);

    const [recentPayments] = await db.execute(
      `
      SELECT
        fp.id,
        fp.student_id,
        fp.amount_paid,
        fp.reference,
        fp.payment_date,
        s.reg_no,
        TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)) AS student_name
      FROM fee_payments fp
      JOIN students s ON s.id = fp.student_id
      ORDER BY fp.payment_date DESC
      LIMIT 10
      `
    );

    const [overdue] = await db.execute(
      `
      SELECT
        sb.student_id,
        sb.balance,
        s.reg_no,
        TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)) AS student_name,
        DATEDIFF(NOW(), COALESCE(sb.last_payment_date, NOW())) AS days_overdue
      FROM student_balances sb
      JOIN students s ON s.id = sb.student_id
      WHERE sb.balance > 0
      ORDER BY sb.balance DESC
      LIMIT 20
      `
    );

    return res.json({
      success: true,
      stats: {
        today_collections: todayTotal,
        week_collections: weekTotal,
        month_collections: monthTotal,
        outstanding_balance: outstanding,
      },
      overdue_students: overdue.map((o) => ({
        student_id: o.student_id,
        reg_no: o.reg_no,
        student_name: o.student_name,
        balance: Number(o.balance || 0),
        days_overdue: Number(o.days_overdue || 0),
      })),
      recent_payments: recentPayments.map((p) => ({
        id: p.id,
        student_id: p.student_id,
        reg_no: p.reg_no,
        student_name: p.student_name,
        amount: Number(p.amount_paid || 0),
        reference: p.reference,
        payment_date: p.payment_date,
      })),
    });
  } catch (err) {
    console.error("Accountant dashboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudentLedger = async (req, res) => {
  try {
    const { student_id } = req.params;
    const sid = Number(student_id);

    const [studentRows] = await db.execute(
      `SELECT id, reg_no, TRIM(CONCAT_WS(' ', first_name, NULLIF(middle_name, ''), last_name)) AS name
       FROM students WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [sid]
    );
    if (!studentRows.length) return res.status(404).json({ error: "Student not found" });

    const [balanceRows] = await db.execute(
      "SELECT total_fees, amount_paid, balance, last_payment_date FROM student_balances WHERE student_id = ? LIMIT 1",
      [sid]
    );
    const summary = balanceRows[0] || { total_fees: 0, amount_paid: 0, balance: 0, last_payment_date: null };

    const [payments] = await db.execute(
      `
      SELECT id, amount_paid, reference, notes, payment_date, created_at
      FROM fee_payments
      WHERE student_id = ?
      ORDER BY payment_date ASC, id ASC
      `,
      [sid]
    );

    let running = Number(summary.total_fees || 0);
    const ledger = payments.map((p) => {
      running -= Number(p.amount_paid || 0);
      return {
        id: p.id,
        payment_date: p.payment_date,
        amount_paid: Number(p.amount_paid || 0),
        reference: p.reference,
        notes: p.notes,
        running_balance: Number(running.toFixed(2)),
      };
    });

    return res.json({
      success: true,
      student: studentRows[0],
      summary: {
        total_fees: Number(summary.total_fees || 0),
        amount_paid: Number(summary.amount_paid || 0),
        balance: Number(summary.balance || 0),
        last_payment_date: summary.last_payment_date,
      },
      payments: ledger,
    });
  } catch (err) {
    console.error("Accountant student ledger error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

