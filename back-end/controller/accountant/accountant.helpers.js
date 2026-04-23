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
      COALESCE(SUM(sfb.total_fee), 0) AS current_fee,
      COALESCE(history.total_historical_fees, 0) AS historical_fee_total,
      COALESCE(payments.amount_paid, 0) AS amount_paid,
      GREATEST(
        COALESCE(SUM(sfb.total_fee), 0) + COALESCE(history.total_historical_fees, 0) - COALESCE(payments.amount_paid, 0),
        0
      ) AS balance,
      payments.last_payment_date,
      payments.last_payment_amount
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.course_id
    LEFT JOIN student_fee_balances sfb ON s.id = sfb.student_id
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
  // 1. Get all courses with student counts
  const [courses] = await db.execute(`
    SELECT 
      c.course_id,
      c.course_name,
      c.course_code,
      c.course_type,
      COUNT(DISTINCT s.id) AS total_students
    FROM courses c
    LEFT JOIN students s ON s.course_id = c.course_id
    GROUP BY c.course_id
  `);

  // 2. Get total expected fees per course (including module/stage)
  const [studentBalances] = await db.execute(`
    SELECT 
      s.course_id,
      SUM(sfb.total_fee) AS total_expected
    FROM student_fee_balances sfb
    INNER JOIN students s ON s.id = sfb.student_id
    GROUP BY s.course_id
  `);

  const balanceMap = {};
  studentBalances.forEach((b) => {
    balanceMap[b.course_id] = Number(b.total_expected || 0);
  });

  // 3. Get total payments per course
  const [payments] = await db.execute(`
    SELECT 
      course_id,
      SUM(amount_paid) AS total_collected
    FROM fee_payments
    GROUP BY course_id
  `);

  const paymentMap = {};
  payments.forEach((p) => {
    paymentMap[p.course_id] = Number(p.total_collected || 0);
  });

  // 4. Get course fees with module/level information
  const [fees] = await db.execute(`
    SELECT 
      cf.id,
      cf.course_id,
      cf.term,
      cf.module,
      cf.amount,
      cf.fee_type_id,
      ft.name AS fee_type_name
    FROM course_fees cf
    JOIN fee_types ft ON ft.id = cf.fee_type_id
    ORDER BY cf.course_id, cf.module, cf.term, cf.fee_type_id
  `);

  const feeMap = {};
  fees.forEach((fee) => {
    if (!feeMap[fee.course_id]) feeMap[fee.course_id] = [];
    feeMap[fee.course_id].push({
      id: fee.id,
      term: fee.term,
      module: fee.module, // This stores module number OR stage number
      amount: Number(fee.amount),
      fee_type_id: fee.fee_type_id,
      fee_type_name: fee.fee_type_name,
    });
  });

  // 5. Build final course summary
  return courses.map((course) => {
    const totalExpected = balanceMap[course.course_id] || 0;
    const totalCollected = paymentMap[course.course_id] || 0;
    const totalOutstanding = totalExpected - totalCollected;
    const collectionRate =
      totalExpected > 0
        ? Number(((totalCollected / totalExpected) * 100).toFixed(2))
        : 0;

    return {
      course_id: course.course_id,
      course_name: course.course_name,
      course_code: course.course_code,
      course_type: course.course_type,
      total_students: Number(course.total_students || 0),
      fees_per_term: feeMap[course.course_id] || [],
      total_expected: totalExpected,
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      collection_rate: collectionRate,
    };
  });
};

// Optional: Get fee types endpoint
export const getFeeTypes = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, description, is_active 
      FROM fee_types 
      WHERE is_active = 1 OR is_active IS NULL
      ORDER BY name
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching fee types:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Optional: Create/Update course fee endpoint
export const saveCourseFee = async (req, res) => {
  try {
    const { id, course_id, fee_type_id, term, module, amount } = req.body;

    if (!course_id || !fee_type_id || !term || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // For non_modular courses, module should be null
    const [course] = await db.execute(
      "SELECT course_type FROM courses WHERE course_id = ?",
      [course_id]
    );
    
    let moduleValue = module;
    if (course[0]?.course_type === "non_modular") {
      moduleValue = null;
    }

    if (id) {
      // Update existing fee
      await db.execute(
        `UPDATE course_fees 
         SET fee_type_id = ?, term = ?, module = ?, amount = ?, updated_at = NOW()
         WHERE id = ?`,
        [fee_type_id, term, moduleValue, amount, id]
      );
      res.json({ message: "Fee updated successfully" });
    } else {
      // Check for duplicate
      const [existing] = await db.execute(
        `SELECT id FROM course_fees 
         WHERE course_id = ? AND fee_type_id = ? AND term = ? AND (module = ? OR (module IS NULL AND ? IS NULL))`,
        [course_id, fee_type_id, term, moduleValue, moduleValue]
      );
      
      if (existing.length > 0) {
        return res.status(409).json({ message: "This fee combination already exists" });
      }

      // Insert new fee
      await db.execute(
        `INSERT INTO course_fees (course_id, fee_type_id, term, module, amount, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [course_id, fee_type_id, term, moduleValue, amount]
      );
      res.json({ message: "Fee added successfully" });
    }
  } catch (err) {
    console.error("Error saving course fee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};