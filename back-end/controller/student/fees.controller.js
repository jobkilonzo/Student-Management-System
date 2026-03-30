import db from "../../database/mysql_database.js";

// GET fee balance
export const getFeeBalance = async (req, res) => {
  try {
    const userId = req.user.id;

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
          COALESCE(cf.amount, 0) AS current_fee,
          COALESCE(history.total_historical_fees, 0) AS historical_fee_total,
          COALESCE(payments.amount_paid, 0) AS amount_paid
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
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
        WHERE s.user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentRows[0];

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

    const [paymentRows] = await db.execute(
      `
        SELECT id, amount_paid, payment_date, reference, notes
        FROM fee_payments
        WHERE student_id = ?
        ORDER BY payment_date DESC, id DESC
        LIMIT 10
      `,
      [student.id]
    );

    const currentFee = Number(student.current_fee || 0);
    const historicalFeeTotal = Number(student.historical_fee_total || 0);
    const totalFees = currentFee + historicalFeeTotal;
    const amountPaid = Number(student.amount_paid || 0);

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
        fee_amount: currentFee,
      },
      fee_history: historyRows.map((history) => ({
        ...history,
        fee_amount: Number(history.fee_amount || 0),
      })),
      current_fee: currentFee,
      historical_fee_total: historicalFeeTotal,
      total_fees: totalFees,
      amount_paid: amountPaid,
      balance: Math.max(totalFees - amountPaid, 0),
      payments: paymentRows.map((payment) => ({
        ...payment,
        amount_paid: Number(payment.amount_paid || 0),
      })),
    });
  } catch (err) {
    console.error("Get Fee Balance Error:", err);
    res.status(500).json({ error: err.message });
  }
};
