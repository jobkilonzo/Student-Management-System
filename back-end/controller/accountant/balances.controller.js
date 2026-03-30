import { getRecentFeePayments, getStudentFinancials } from "./accountant.helpers.js";

export const getStudentBalances = async (_req, res) => {
  try {
    const [students, recentPayments] = await Promise.all([
      getStudentFinancials(),
      getRecentFeePayments(100),
    ]);

    const balances = students.map((student) => ({
      id: student.id,
      reg_no: student.reg_no,
      student_name: `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.replace(/\s+/g, " ").trim(),
      email: student.email,
      phone: student.phone,
      course_name: student.course_name,
      course_code: student.course_code,
      module: student.module,
      term: student.term,
      created_at: student.createdAt,
      total_fees: student.total_fees,
      amount_paid: student.amount_paid,
      balance: student.balance,
      status: student.status,
      last_payment_amount: student.last_payment_amount,
      last_payment_date: student.last_payment_date,
      payments: recentPayments
        .filter((payment) => Number(payment.student_id) === Number(student.id))
        .slice(0, 5)
        .map((payment) => ({
          id: payment.id,
          amount_paid: Number(payment.amount_paid || 0),
          payment_date: payment.payment_date,
          reference: payment.reference,
          notes: payment.notes,
        })),
    }));

    res.json(balances);
  } catch (err) {
    console.error("Get Student Balances Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
