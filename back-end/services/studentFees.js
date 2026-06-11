const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const recalculateStudentBalance = async (connection, studentId) => {
  const [[student]] = await connection.execute(
    "SELECT id, course_id FROM students WHERE id = ? LIMIT 1",
    [Number(studentId)]
  );

  if (!student) throw new Error("Student not found");

  const [[feeTotals]] = await connection.execute(
    `
    SELECT COALESCE(SUM(total_fee), 0) AS current_fees
    FROM student_fee_balances
    WHERE student_id = ?
    `,
    [Number(studentId)]
  );

  const [[historyTotals]] = await connection.execute(
    `
    SELECT COALESCE(SUM(fee_amount), 0) AS historical_fees
    FROM student_progressions
    WHERE student_id = ?
    `,
    [Number(studentId)]
  );

  const [[paymentTotals]] = await connection.execute(
    `
    SELECT
      COALESCE(SUM(amount_paid), 0) AS amount_paid,
      MAX(payment_date) AS last_payment_date
    FROM fee_payments
    WHERE student_id = ?
    `,
    [Number(studentId)]
  );

  const totalFees = toNumber(feeTotals.current_fees) + toNumber(historyTotals.historical_fees);
  const amountPaid = toNumber(paymentTotals.amount_paid);
  const balance = Math.max(totalFees - amountPaid, 0);

  await connection.execute(
    `
    INSERT INTO student_balances
      (student_id, course_id, total_fees, amount_paid, balance, last_payment_date, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      course_id = VALUES(course_id),
      total_fees = VALUES(total_fees),
      amount_paid = VALUES(amount_paid),
      balance = VALUES(balance),
      last_payment_date = VALUES(last_payment_date),
      updated_at = NOW()
    `,
    [
      Number(studentId),
      Number(student.course_id),
      totalFees,
      amountPaid,
      balance,
      paymentTotals.last_payment_date || null,
    ]
  );

  return { totalFees, amountPaid, balance };
};

export const applyCourseFeesToStudent = async (
  connection,
  { studentId, courseId, module, term, selectedFeeIds = [], actorId = null, applyAllWhenEmpty = true }
) => {
  const params = [Number(courseId), Number(term)];
  let query = `
    SELECT id, course_id, term, module, fee_type_id, amount
    FROM course_fees
    WHERE course_id = ? AND term = ?
  `;

  if (module === null || module === undefined || module === "") {
    query += " AND module IS NULL";
  } else {
    query += " AND module = ?";
    params.push(Number(module));
  }

  const safeSelectedIds = selectedFeeIds.map(Number).filter(Number.isFinite);
  if (safeSelectedIds.length) {
    query += ` AND id IN (${safeSelectedIds.map(() => "?").join(",")})`;
    params.push(...safeSelectedIds);
  } else if (!applyAllWhenEmpty) {
    query += " AND 1 = 0";
  }

  query += " ORDER BY fee_type_id";

  const [fees] = await connection.execute(query, params);

  await connection.execute(
    `
    DELETE FROM student_fee_balances
    WHERE student_id = ? AND course_id = ? AND term = ?
      AND (module = ? OR (module IS NULL AND ? IS NULL))
    `,
    [
      Number(studentId),
      Number(courseId),
      Number(term),
      module === null || module === undefined || module === "" ? null : Number(module),
      module === null || module === undefined || module === "" ? null : Number(module),
    ]
  );

  for (const fee of fees) {
    const amount = toNumber(fee.amount);
    await connection.execute(
      `
      INSERT INTO student_fee_balances
        (student_id, course_id, term, fee_type_id, total_fee, amount_paid, balance, module, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        total_fee = VALUES(total_fee),
        balance = VALUES(balance),
        module = VALUES(module),
        updated_at = NOW()
      `,
      [
        Number(studentId),
        Number(courseId),
        Number(fee.term),
        Number(fee.fee_type_id),
        amount,
        amount,
        fee.module === null || fee.module === undefined ? null : Number(fee.module),
      ]
    );
  }

  const summary = await recalculateStudentBalance(connection, studentId);

  await connection.execute(
    `
    INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
    VALUES (?, 'APPLY_STUDENT_FEES', ?, ?, NOW())
    `,
    [
      actorId,
      Number(studentId),
      JSON.stringify({
        course_id: Number(courseId),
        module: module === null || module === undefined || module === "" ? null : Number(module),
        term: Number(term),
        selected_fee_ids: safeSelectedIds,
        applied: fees.length,
        total_fees: summary.totalFees,
      }),
    ]
  );

  return { applied: fees.length, fees, ...summary };
};

export const replaceStudentFeeItems = async (connection, { studentId, feeItems, actorId = null }) => {
  const [[student]] = await connection.execute(
    "SELECT id, course_id, module, term FROM students WHERE id = ? LIMIT 1 FOR UPDATE",
    [Number(studentId)]
  );

  if (!student) throw new Error("Student not found");

  if (!Array.isArray(feeItems) || feeItems.length === 0) {
    throw new Error("At least one fee item is required");
  }

  await connection.execute("DELETE FROM student_fee_balances WHERE student_id = ?", [Number(studentId)]);

  for (const item of feeItems) {
    const feeTypeId = Number(item.fee_type_id);
    const totalFee = Number(item.total_fee);
    const term = item.term === undefined || item.term === "" ? student.term : Number(item.term);
    const module = item.module === undefined || item.module === "" ? student.module : Number(item.module);

    if (!Number.isFinite(feeTypeId) || feeTypeId < 1) throw new Error("fee_type_id must be valid");
    if (!Number.isFinite(totalFee) || totalFee < 0) throw new Error("total_fee must be valid");
    if (!Number.isFinite(Number(term))) throw new Error("term must be valid");

    await connection.execute(
      `
      INSERT INTO student_fee_balances
        (student_id, course_id, term, fee_type_id, total_fee, amount_paid, balance, module, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())
      `,
      [
        Number(studentId),
        Number(student.course_id),
        Number(term),
        feeTypeId,
        totalFee,
        totalFee,
        module === null || module === undefined || Number.isNaN(Number(module)) ? null : Number(module),
      ]
    );
  }

  const summary = await recalculateStudentBalance(connection, studentId);

  await connection.execute(
    `
    INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
    VALUES (?, 'ACCOUNTANT_UPDATE_STUDENT_FEES', ?, ?, NOW())
    `,
    [actorId, Number(studentId), JSON.stringify({ fee_items: feeItems, total_fees: summary.totalFees })]
  );

  return summary;
};
