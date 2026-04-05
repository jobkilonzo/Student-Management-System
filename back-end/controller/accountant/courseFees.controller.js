import db from "../../database/mysql_database.js";
import { getCourseFeeSummary } from "./accountant.helpers.js";

export const getCourseFees = async (_req, res) => {
  try {
    const summary = await getCourseFeeSummary();
    res.json(summary);
  } catch (err) {
    console.error("Get Course Fees Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const upsertCourseFee = async (req, res) => {
  try {
    const { course_id, amount, term, fee_type_id, module } = req.body;

    const numericAmount = Number(amount);
    const numericTerm = Number(term);
    const numericFeeTypeId = Number(fee_type_id);
    const numericModule = module ? Number(module) : null;

    // Validations
    if (!course_id) return res.status(400).json({ error: "course_id is required" });
    if (Number.isNaN(numericAmount) || numericAmount < 0)
      return res.status(400).json({ error: "amount must be a non-negative number" });
    if (Number.isNaN(numericTerm) || numericTerm < 1)
      return res.status(400).json({ error: "term must be a positive integer" });
    if (Number.isNaN(numericFeeTypeId) || numericFeeTypeId < 1)
      return res.status(400).json({ error: "fee_type_id is required" });

    // Verify course exists
    const [courseRows] = await db.execute(
      "SELECT course_id FROM courses WHERE course_id = ? LIMIT 1",
      [course_id]
    );
    if (!courseRows.length) return res.status(404).json({ error: "Course not found" });

    // 1️⃣ Upsert into course_fees
    await db.execute(
      `
      INSERT INTO course_fees 
        (course_id, term, amount, fee_type_id, module, currency, set_by)
      VALUES (?, ?, ?, ?, ?, 'KSh', ?)
      ON DUPLICATE KEY UPDATE
        amount     = VALUES(amount),
        module     = VALUES(module),
        fee_type_id = VALUES(fee_type_id),
        updated_at = CURRENT_TIMESTAMP
      `,
      [course_id, numericTerm, numericAmount, numericFeeTypeId, numericModule, req.user.id]
    );

    // 2️⃣ Update student_balances (overall totals)
    await db.execute(
      `
      INSERT INTO student_balances (student_id, course_id, total_fees, balance, updated_at)
      SELECT s.id, cf.course_id, SUM(cf.amount) AS total_fees, SUM(cf.amount) - IFNULL(sb.amount_paid, 0), NOW()
      FROM students s
      JOIN course_fees cf ON cf.course_id = s.course_id
      LEFT JOIN student_balances sb ON sb.student_id = s.id AND sb.course_id = cf.course_id
      WHERE cf.course_id = ?
      GROUP BY s.id, cf.course_id
      ON DUPLICATE KEY UPDATE
        total_fees = VALUES(total_fees),
        balance = VALUES(balance),
        updated_at = NOW()
      `,
      [course_id]
    );

    // 3️⃣ Update student_fee_balances (term/module-specific)
    await db.execute(
      `
      INSERT INTO student_fee_balances
        (student_id, course_id, term, fee_type_id, module, total_fee, balance, updated_at)
      SELECT s.id, cf.course_id, cf.term, cf.fee_type_id, cf.module, cf.amount, cf.amount, NOW()
      FROM students s
      JOIN course_fees cf ON cf.course_id = s.course_id
      WHERE cf.course_id = ?
      ON DUPLICATE KEY UPDATE
        total_fee = VALUES(total_fee),
        balance = VALUES(balance),
        module = VALUES(module),
        updated_at = NOW()
      `,
      [course_id]
    );

    res.json({ success: true, message: "Course fee saved and student balances updated" });
  } catch (err) {
    console.error("Upsert Course Fee Error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "This fee combination (term + fee type + module) already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};