import db from "../../database/mysql_database.js";

// GET fee balance (Student Portal)
export const getFeeBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Main student + overall balance + last payment
    const [studentRows] = await db.execute(
      `
        SELECT
          s.id,
          s.reg_no,
          CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
          s.course_id,
          s.module,
          s.term,
          c.course_name,
          c.course_code,

          -- Overall totals from pre-computed table
          COALESCE(sb.total_fees, 0)  AS total_fees,
          COALESCE(sb.amount_paid, 0) AS amount_paid,
          COALESCE(sb.balance, 0)     AS balance,
          sb.last_payment_date,

          -- Latest payment amount per student
          lp.last_amount_paid
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        LEFT JOIN student_balances sb ON sb.student_id = s.id
        LEFT JOIN (
          SELECT fp1.student_id, fp1.amount_paid AS last_amount_paid
          FROM fee_payments fp1
          INNER JOIN (
              SELECT student_id, MAX(payment_date) AS max_date
              FROM fee_payments
              GROUP BY student_id
          ) fp2 ON fp1.student_id = fp2.student_id AND fp1.payment_date = fp2.max_date
          WHERE fp1.id = (
              SELECT MAX(id)
              FROM fee_payments
              WHERE student_id = fp1.student_id AND payment_date = fp1.payment_date
          )
        ) lp ON lp.student_id = s.id
        WHERE s.user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentRows[0];

    // 2️⃣ Current fee breakdown by fee type (for current term + module)
    const [feeBreakdownRows] = await db.execute(
      `
        SELECT 
          sfb.fee_type_id,
          ft.name AS fee_type_name,
          COALESCE(sfb.total_fee, 0)   AS total_fee,
          COALESCE(sfb.amount_paid, 0) AS amount_paid,
          COALESCE(sfb.balance, 0)     AS balance
        FROM student_fee_balances sfb
        LEFT JOIN fee_types ft ON ft.id = sfb.fee_type_id
        WHERE sfb.student_id = ?
          AND sfb.course_id = ?
          AND sfb.term = ?
          AND COALESCE(sfb.module, 0) = COALESCE(?, 0)
        ORDER BY ft.name
      `,
      [student.id, student.course_id, student.term, student.module || null]
    );

    // 3️⃣ Historical fee progressions
    const [historyRows] = await db.execute(
      `
        SELECT
          id,
          course_id,
          course_code,
          course_name,
          module,
          term,
          fee_amount,
          archived_at
        FROM student_progressions
        WHERE student_id = ?
        ORDER BY archived_at DESC, id DESC
      `,
      [student.id]
    );

    // 4️⃣ Recent 10 payments
    const [paymentRows] = await db.execute(
      `
        SELECT 
          id, 
          amount_paid, 
          payment_date, 
          reference, 
          notes
        FROM fee_payments
        WHERE student_id = ?
        ORDER BY payment_date DESC, id DESC
        LIMIT 10
      `,
      [student.id]
    );

    // 5️⃣ Compute totals
    const currentFeeTotal = feeBreakdownRows.reduce(
      (sum, row) => sum + Number(row.total_fee),
      0
    );
    const currentBalanceTotal = feeBreakdownRows.reduce(
      (sum, row) => sum + Number(row.balance),
      0
    );
    const historicalFeeTotal = Number(student.total_fees || 0) - currentFeeTotal;

    res.json({
      student_id: student.id,
      student_name: student.student_name,
      reg_no: student.reg_no,
      course_name: student.course_name,
      course_code: student.course_code,

      current_stage: {
        course_id: student.course_id,
        course_name: student.course_name,
        course_code: student.course_code,
        module: student.module,
        term: student.term,
        fee_amount: currentBalanceTotal, // actual amount due this term/module
      },

      current_fees_breakdown: feeBreakdownRows.map((row) => ({
        fee_type_id: row.fee_type_id,
        fee_type_name: row.fee_type_name || "Unknown",
        total_fee: Number(row.total_fee),
        amount_paid: Number(row.amount_paid),
        balance: Number(row.balance),
      })),

      fee_history: historyRows.map((h) => ({
        ...h,
        fee_amount: Number(h.fee_amount || 0),
      })),

      // Totals
      current_fee: currentFeeTotal,
      historical_fee_total: historicalFeeTotal,
      total_fees: Number(student.total_fees || 0),
      amount_paid: Number(student.amount_paid || 0),
      balance: Number(student.balance || 0),
      last_payment_amount: Number(student.last_amount_paid || 0),
      last_payment_date: student.last_payment_date || null,

      payments: paymentRows.map((p) => ({
        ...p,
        amount_paid: Number(p.amount_paid || 0),
      })),
    });
  } catch (err) {
    console.error("Get Fee Balance Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};