import db from "../../database/mysql_database.js";
import { recalculateStudentBalance } from "../../services/studentFees.js";

export const recordFeePayment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { student_id, amount_paid, payment_date, reference, notes } = req.body;
    const numericAmount = Number(amount_paid);

    // 1️⃣ Validate inputs
    if (!student_id) return res.status(400).json({ error: "student_id is required" });
    if (Number.isNaN(numericAmount) || numericAmount <= 0)
      return res.status(400).json({ error: "amount_paid must be greater than 0" });

    // 2️⃣ Fetch student info and course fee (without term)
    const [studentRows] = await connection.execute(
      `
      SELECT
        s.id,
        s.course_id,
        COALESCE(fees.current_fee, 0) AS current_fee,
        COALESCE(history.total_historical_fees, 0) AS historical_fee_total,
        COALESCE(payments.amount_paid, 0) AS amount_paid
      FROM students s
      LEFT JOIN (
        SELECT student_id, SUM(total_fee) AS current_fee
        FROM student_fee_balances
        GROUP BY student_id
      ) fees ON fees.student_id = s.id
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

    // 3️⃣ Ensure course fee is set
    if (!student.current_fee || student.current_fee <= 0) {
      return res
        .status(400)
        .json({ error: "Set the course fee first before recording payments" });
    }

    // 4️⃣ Calculate new balance
    const totalFees = Number(student.current_fee) + Number(student.historical_fee_total || 0);
    const alreadyPaid = Number(student.amount_paid || 0);
    const previousBalance = totalFees - alreadyPaid;
    const newBalance = previousBalance - numericAmount; // can be negative if overpaid

    // 5️⃣ Start transaction
    await connection.beginTransaction();

    // 5a️⃣ Insert payment (removed term column)
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

    // 5b️⃣ Update or insert into student_balances
    await recalculateStudentBalance(connection, student_id);

    // 6️⃣ Commit
    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Fee payment recorded successfully",
      previous_balance: previousBalance,
      payment: numericAmount,
      new_balance: newBalance,
    });
  } catch (err) {
    try { await connection.rollback(); } catch {}
    console.error("Record Fee Payment Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
};
