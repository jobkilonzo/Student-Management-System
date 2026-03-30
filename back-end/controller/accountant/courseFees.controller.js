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
    const { course_id, amount } = req.body;
    const numericAmount = Number(amount);

    if (!course_id) {
      return res.status(400).json({ error: "course_id is required" });
    }

    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ error: "amount must be a non-negative number" });
    }

    const [courseRows] = await db.execute(
      "SELECT course_id FROM courses WHERE course_id = ? LIMIT 1",
      [course_id]
    );

    if (!courseRows.length) {
      return res.status(404).json({ error: "Course not found" });
    }

    await db.execute(
      `
        INSERT INTO course_fees (course_id, amount, set_by)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          amount = VALUES(amount),
          set_by = VALUES(set_by)
      `,
      [course_id, numericAmount, req.user.id]
    );

    res.json({ success: true, message: "Course fee updated successfully" });
  } catch (err) {
    console.error("Upsert Course Fee Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
