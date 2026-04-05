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
      COALESCE(SUM(cf.amount), 0) AS current_fee,
      COALESCE(history.total_historical_fees, 0) AS historical_fee_total,
      COALESCE(payments.amount_paid, 0) AS amount_paid,
      GREATEST(
        COALESCE(SUM(cf.amount), 0) + COALESCE(history.total_historical_fees, 0) - COALESCE(payments.amount_paid, 0),
        0
      ) AS balance,
      payments.last_payment_date,
      payments.last_payment_amount
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.course_id
    LEFT JOIN course_fees cf ON s.course_id = cf.course_id
    LEFT JOIN (
      SELECT student_id, SUM(fee_amount) AS total_historical_fees
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
    GROUP BY s.id
    ORDER BY s.createdAt DESC, s.id DESC;
  `;

  const [rows] = await db.execute(query);

  return rows.map((row) => {
    const currentFee = Number(row.current_fee || 0);
    const historicalFeeTotal = Number(row.historical_fee_total || 0);
    const totalFees = currentFee + historicalFeeTotal;
    const amountPaid = Number(row.amount_paid || 0);
    const balance = Number(row.balance || 0);
    const lastPayment = Number(row.last_payment_amount || 0);

    // Determine payment status
    let status = "No Fee Set";
    if (totalFees > 0 && balance === 0) {
      status = "Cleared";
    } else if (totalFees > 0 && amountPaid > 0) {
      status = "Partially Paid";
    } else if (totalFees > 0) {
      status = "Outstanding";
    }

    return {
      ...row,
      current_fee: currentFee,
      historical_fee_total: historicalFeeTotal,
      total_fees: totalFees,
      amount_paid: amountPaid,
      balance,
      last_payment_amount: lastPayment,
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
  // 1. Get all courses + students count
  const [courses] = await db.execute(`
    SELECT 
      c.course_id,
      c.course_name,
      c.course_code,
      COUNT(s.id) AS total_students
    FROM courses c
    LEFT JOIN students s ON s.course_id = c.course_id
    GROUP BY c.course_id
  `);

  // 2. Get course fees (NOW includes fee types)
  const [fees] = await db.execute(`
    SELECT 
      cf.course_id,
      cf.term,
      cf.amount,
      cf.fee_type_id,
      ft.name AS fee_type_name
    FROM course_fees cf
    JOIN fee_types ft ON ft.id = cf.fee_type_id
  `);

  // 3. Get payments
  const [payments] = await db.execute(`
    SELECT 
      course_id,
      SUM(amount_paid) AS total_collected
    FROM fee_payments
    GROUP BY course_id
  `);

  // Map payments
  const paymentMap = {};
  payments.forEach((p) => {
    paymentMap[p.course_id] = Number(p.total_collected || 0);
  });

  // Map fees per course
  const feeMap = {};
  fees.forEach((f) => {
    if (!feeMap[f.course_id]) feeMap[f.course_id] = [];

    feeMap[f.course_id].push({
      term: f.term,
      amount: Number(f.amount),
      fee_type_id: f.fee_type_id,
      fee_type_name: f.fee_type_name,
    });
  });

  // 4. Build final response
  return courses.map((course) => {
    const courseFees = feeMap[course.course_id] || [];

    // Total fee per student = SUM of all fee types
    const totalFeePerStudent = courseFees.reduce(
      (sum, f) => sum + Number(f.amount || 0),
      0
    );

    const totalExpected = totalFeePerStudent * course.total_students;
    const totalCollected = paymentMap[course.course_id] || 0;
    const totalOutstanding = totalExpected - totalCollected;

    const collectionRate =
      totalExpected > 0
        ? ((totalCollected / totalExpected) * 100).toFixed(2)
        : 0;

    return {
      ...course,
      fees_per_term: courseFees,
      total_expected: totalExpected,
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      collection_rate: Number(collectionRate),
    };
  });
};