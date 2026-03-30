import { getStudentFinancials } from "./accountant.helpers.js";

export const getReports = async (_req, res) => {
  try {
    const students = await getStudentFinancials();
    const balances = students.map((student) => ({
      ...student,
      student_name: `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.replace(/\s+/g, " ").trim(),
    }));

    const statusBreakdown = balances.reduce((acc, student) => {
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    }, {});

    const moduleBreakdown = balances.reduce((acc, student) => {
      const key = student.module || "Unassigned";
      if (!acc[key]) {
        acc[key] = {
          module: key,
          total_students: 0,
          total_expected: 0,
          total_collected: 0,
          total_outstanding: 0,
        };
      }

      acc[key].total_students += 1;
      acc[key].total_expected += student.total_fees;
      acc[key].total_collected += student.amount_paid;
      acc[key].total_outstanding += student.balance;
      return acc;
    }, {});

    const topDefaulters = balances
      .filter((student) => student.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 8)
      .map((student) => ({
        id: student.id,
        reg_no: student.reg_no,
        student_name: student.student_name,
        course_name: student.course_name,
        module: student.module,
        balance: student.balance,
        total_fees: student.total_fees,
        amount_paid: student.amount_paid,
        status: student.status,
      }));

    res.json({
      status_breakdown: Object.entries(statusBreakdown).map(([status, total_students]) => ({
        status,
        total_students,
      })),
      module_breakdown: Object.values(moduleBreakdown).sort((a, b) => a.module.localeCompare(b.module)),
      top_defaulters: topDefaulters,
    });
  } catch (err) {
    console.error("Get Accountant Reports Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
