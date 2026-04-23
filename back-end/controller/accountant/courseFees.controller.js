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

    if (!course_id) return res.status(400).json({ error: "course_id is required" });
    if (Number.isNaN(numericAmount) || numericAmount < 0)
      return res.status(400).json({ error: "amount must be valid" });
    if (Number.isNaN(numericTerm) || numericTerm < 1)
      return res.status(400).json({ error: "term must be valid" });
    if (Number.isNaN(numericFeeTypeId) || numericFeeTypeId < 1)
      return res.status(400).json({ error: "fee_type_id is required" });

    // Ensure course exists
    const [courseRows] = await db.execute(
      "SELECT course_id FROM courses WHERE course_id = ? LIMIT 1",
      [course_id]
    );
    if (!courseRows.length) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Now this will work correctly with the new unique constraint
    const [result] = await db.execute(
      `INSERT INTO course_fees 
        (course_id, term, amount, fee_type_id, module, currency, set_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'KSh', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        set_by = VALUES(set_by),
        updated_at = CURRENT_TIMESTAMP`,
      [course_id, numericTerm, numericAmount, numericFeeTypeId, numericModule, req.user.id]
    );

    if (result.affectedRows === 1 && result.insertId > 0) {
      console.log(`✅ Inserted new fee: Course ${course_id}, Fee Type ${numericFeeTypeId}, Term ${numericTerm}, Module ${numericModule}`);
    } else {
      console.log(`✅ Updated existing fee: Course ${course_id}, Fee Type ${numericFeeTypeId}, Term ${numericTerm}, Module ${numericModule}`);
    }

    res.json({ 
      success: true, 
      message: "Course fee saved successfully",
      data: {
        course_id,
        term: numericTerm,
        module: numericModule,
        fee_type_id: numericFeeTypeId,
        amount: numericAmount
      }
    });

  } catch (err) {
    console.error("Upsert Course Fee Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};