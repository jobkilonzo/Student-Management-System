import db from "../../database/mysql_database.js";

// GET assigned units
export const getAssignedUnits = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the student's current academic stage
    const [studentResults] = await db.execute(
      `
        SELECT s.course_id, s.module, s.term
        FROM students s
        WHERE s.user_id = ?
      `,
      [userId]
    );

    if (studentResults.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const courseId = studentResults[0].course_id;
    const currentModule = studentResults[0].module || null;
    const currentTerm = studentResults[0].term || null;

    // Get units for the student's current course/module
    const query = `
      SELECT
        u.unit_id,
        u.unit_code,
        u.unit_name,
        u.module,
        c.course_name,
        c.course_code,
        ? AS current_term
      FROM units u
      LEFT JOIN courses c ON u.course_id = c.course_id
      WHERE u.course_id = ?
        AND (? IS NULL OR ? = '' OR u.module IS NULL OR u.module = '' OR u.module = ?)
      ORDER BY u.unit_code
    `;
    const [results] = await db.execute(query, [currentTerm, courseId, currentModule, currentModule, currentModule]);

    res.json(results);
  } catch (err) {
    console.error("Get Assigned Units Error:", err);
    res.status(500).json({ error: err.message });
  }
};
