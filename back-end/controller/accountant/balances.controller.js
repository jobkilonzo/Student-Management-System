import { getRecentFeePayments, getStudentFinancials } from "./accountant.helpers.js";
import db from "../../database/mysql_database.js";
import { replaceStudentFeeItems } from "../../services/studentFees.js";

export const getStudentBalances = async (_req, res) => {
  try {
    const [students, recentPayments] = await Promise.all([
      getStudentFinancials(),
      getRecentFeePayments(100),
    ]);

    const [feeRows] = await db.execute(`
      SELECT
        sfb.id,
        sfb.student_id,
        sfb.course_id,
        sfb.term,
        sfb.module,
        sfb.fee_type_id,
        sfb.total_fee,
        sfb.amount_paid,
        sfb.balance,
        ft.name AS fee_type_name
      FROM student_fee_balances sfb
      LEFT JOIN fee_types ft ON ft.id = sfb.fee_type_id
      ORDER BY sfb.student_id, sfb.module, sfb.term, ft.name
    `);

    const feeBreakdownByStudent = feeRows.reduce((map, row) => {
      const key = Number(row.student_id);
      if (!map[key]) map[key] = [];
      map[key].push({
        id: row.id,
        course_id: row.course_id,
        term: row.term,
        module: row.module,
        fee_type_id: row.fee_type_id,
        fee_type_name: row.fee_type_name || `Fee Type ${row.fee_type_id}`,
        total_fee: Number(row.total_fee || 0),
        amount_paid: Number(row.amount_paid || 0),
        balance: Number(row.balance || 0),
      });
      return map;
    }, {});

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
      fee_breakdown: feeBreakdownByStudent[Number(student.id)] || [],
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

export const updateStudentFees = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { studentId } = req.params;
    const { fee_items } = req.body || {};

    await connection.beginTransaction();
    const summary = await replaceStudentFeeItems(connection, {
      studentId,
      feeItems: fee_items,
      actorId: req.user?.id || null,
    });
    await connection.commit();

    res.json({
      success: true,
      message: "Student fees updated successfully",
      ...summary,
    });
  } catch (err) {
    try { await connection.rollback(); } catch {}
    console.error("Update Student Fees Error:", err);
    res.status(400).json({ error: err.message || "Failed to update student fees" });
  } finally {
    connection.release();
  }
};
