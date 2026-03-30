import db from "../../database/mysql_database.js";

export const recordFeePayment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { student_id, amount_paid, payment_date, reference, notes } = req.body;
    const numericAmount = Number(amount_paid);

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "amount_paid must be greater than 0" });
    }

    const [studentRows] = await connection.execute(
      `
        SELECT
          s.id,
          s.course_id,
          COALESCE(cf.amount, 0) AS current_fee,
          COALESCE(history.total_historical_fees, 0) AS historical_fee_total,
          COALESCE(payments.amount_paid, 0) AS amount_paid
        FROM students s
        LEFT JOIN course_fees cf ON s.course_id = cf.course_id
        LEFT JOIN (
          SELECT student_id, SUM(fee_amount) AS total_historical_fees
          FROM student_progressions
          GROUP BY student_id
        ) history ON history.student_id = s.id
        LEFT JOIN (
          SELECT student_id, SUM(amount_paid) AS amount_paid
          FROM fee_payments
          GROUP BY student_id
        ) payments ON payments.student_id = s.id
        WHERE s.id = ?
        LIMIT 1
      `,
      [student_id]
    );

    if (!studentRows.length) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentRows[0];
    const totalFees =
      Number(student.current_fee || 0) + Number(student.historical_fee_total || 0);
    const alreadyPaid = Number(student.amount_paid || 0);
    const balance = totalFees - alreadyPaid;

    if (totalFees <= 0) {
      return res.status(400).json({ error: "Set the course fee first before recording payments" });
    }

    if (numericAmount > balance) {
      return res.status(400).json({ error: "Payment amount exceeds current balance" });
    }

    await connection.beginTransaction();

    await connection.execute(
      `
        INSERT INTO fee_payments
        (student_id, course_id, amount_paid, payment_date, reference, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        student_id,
        student.course_id,
        numericAmount,
        payment_date || new Date(),
        reference || null,
        notes || null,
        req.user.id,
      ]
    );

    await connection.commit();

    res.status(201).json({ success: true, message: "Fee payment recorded successfully" });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback errors when no transaction was started.
    }
    console.error("Record Fee Payment Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
};
