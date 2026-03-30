import db from "../../database/mysql_database.js";
import { getRecentFeePayments, getStudentFinancials } from "./accountant.helpers.js";

export const getOverview = async (_req, res) => {
  try {
    const [studentRows, courseRows, accountantRows, recentPayments] = await Promise.all([
      getStudentFinancials(),
      db.execute("SELECT course_id FROM courses"),
      db.execute("SELECT id FROM users WHERE role = 'accountant'"),
      getRecentFeePayments(5),
    ]);

    const [courses] = courseRows;
    const [accountants] = accountantRows;

    const totals = studentRows.reduce(
      (acc, student) => {
        acc.totalExpected += student.total_fees;
        acc.totalCollected += student.amount_paid;
        acc.totalOutstanding += student.balance;
        if (student.balance > 0) acc.studentsWithBalances += 1;
        return acc;
      },
      {
        totalExpected: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        studentsWithBalances: 0,
      }
    );

    const recentActivity = recentPayments.map((payment) => ({
      id: payment.id,
      student_id: payment.student_id,
      reg_no: payment.reg_no,
      student_name: payment.student_name,
      course_name: payment.course_name,
      amount: Number(payment.amount_paid || 0),
      reference: payment.reference,
      payment_date: payment.payment_date,
    }));

    res.json({
      stats: {
        total_students: studentRows.length,
        total_courses: courses.length,
        total_accountants: accountants.length,
        total_expected: totals.totalExpected,
        total_collected: totals.totalCollected,
        total_outstanding: totals.totalOutstanding,
        students_with_balances: totals.studentsWithBalances,
        collection_rate: totals.totalExpected
          ? Number(((totals.totalCollected / totals.totalExpected) * 100).toFixed(1))
          : 0,
      },
      recent_activity: recentActivity,
    });
  } catch (err) {
    console.error("Get Accountant Overview Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
