import db from "../../database/mysql_database.js";

export const getStudentsWithCourses = async () => {
  const query = `
    SELECT
      s.id,
      s.user_id,
      s.reg_no,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.email,
      s.phone,
      s.course_id,
      s.module,
      s.term,
      s.createdAt,
      c.course_name,
      c.course_code
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.course_id
    ORDER BY s.createdAt DESC, s.id DESC
  `;

  const [rows] = await db.execute(query);
  return rows;
};

export const getStudentFinancials = async () => {
  const query = `
    SELECT
      s.id,
      s.user_id,
      s.reg_no,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.email,
      s.phone,
      s.course_id,
      s.module,
      s.term,
      s.createdAt,
      c.course_name,
      c.course_code,
      COALESCE(cf.amount, 0) AS current_fee,
      COALESCE(history.total_historical_fees, 0) AS historical_fee_total,
      COALESCE(payments.amount_paid, 0) AS amount_paid,
      GREATEST(
        COALESCE(cf.amount, 0) + COALESCE(history.total_historical_fees, 0) - COALESCE(payments.amount_paid, 0),
        0
      ) AS balance,
      payments.last_payment_date,
      payments.last_payment_amount
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.course_id
    LEFT JOIN course_fees cf ON s.course_id = cf.course_id
    LEFT JOIN (
      SELECT
        student_id,
        SUM(fee_amount) AS total_historical_fees
      FROM student_progressions
      GROUP BY student_id
    ) history ON history.student_id = s.id
    LEFT JOIN (
      SELECT
        fp.student_id,
        SUM(fp.amount_paid) AS amount_paid,
        MAX(fp.payment_date) AS last_payment_date,
        (
          SELECT fp2.amount_paid
          FROM fee_payments fp2
          WHERE fp2.student_id = fp.student_id
          ORDER BY fp2.payment_date DESC, fp2.id DESC
          LIMIT 1
        ) AS last_payment_amount
      FROM fee_payments fp
      GROUP BY fp.student_id
    ) payments ON payments.student_id = s.id
    ORDER BY s.createdAt DESC, s.id DESC
  `;

  const [rows] = await db.execute(query);

  return rows.map((row) => {
    const currentFee = Number(row.current_fee || 0);
    const historicalFeeTotal = Number(row.historical_fee_total || 0);
    const totalFees = currentFee + historicalFeeTotal;
    let status = "No Fee Set";

    if (totalFees > 0 && Number(row.balance) === 0) {
      status = "Cleared";
    } else if (totalFees > 0 && Number(row.amount_paid) > 0) {
      status = "Partially Paid";
    } else if (totalFees > 0) {
      status = "Outstanding";
    }

    return {
      ...row,
      current_fee: currentFee,
      historical_fee_total: historicalFeeTotal,
      total_fees: totalFees,
      amount_paid: Number(row.amount_paid || 0),
      balance: Number(row.balance || 0),
      last_payment_amount: Number(row.last_payment_amount || 0),
      status,
    };
  });
};

export const getRecentFeePayments = async (limit = 5) => {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 5;
  const query = `
    SELECT
      fp.id,
      fp.student_id,
      fp.course_id,
      fp.amount_paid,
      fp.payment_date,
      fp.reference,
      fp.notes,
      s.reg_no,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      c.course_name,
      c.course_code
    FROM fee_payments fp
    INNER JOIN students s ON fp.student_id = s.id
    INNER JOIN courses c ON fp.course_id = c.course_id
    ORDER BY fp.payment_date DESC, fp.id DESC
    LIMIT ${safeLimit}
  `;

  const [rows] = await db.query(query);
  return rows;
};

export const getCourseFeeSummary = async () => {
  const query = `
    SELECT
      c.course_id,
      c.course_code,
      c.course_name,
      COALESCE(cf.amount, 0) AS fee_amount,
      COUNT(DISTINCT s.id) AS total_students,
      COALESCE(course_payments.total_collected, 0) AS total_collected
    FROM courses c
    LEFT JOIN course_fees cf ON c.course_id = cf.course_id
    LEFT JOIN students s ON c.course_id = s.course_id
    LEFT JOIN (
      SELECT
        course_id,
        SUM(amount_paid) AS total_collected
      FROM fee_payments
      GROUP BY course_id
    ) course_payments ON c.course_id = course_payments.course_id
    GROUP BY c.course_id, c.course_code, c.course_name, cf.amount, course_payments.total_collected
    ORDER BY c.course_name ASC
  `;

  const [rows] = await db.execute(query);
  return rows.map((row) => {
    const feeAmount = Number(row.fee_amount || 0);
    const totalStudents = Number(row.total_students || 0);
    const totalExpected = feeAmount * totalStudents;
    const totalCollected = Number(row.total_collected || 0);
    const totalOutstanding = Math.max(totalExpected - totalCollected, 0);

    return {
      ...row,
      fee_amount: feeAmount,
      total_students: totalStudents,
      total_expected: totalExpected,
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      collection_rate: totalExpected ? Number(((totalCollected / totalExpected) * 100).toFixed(1)) : 0,
    };
  });
};
