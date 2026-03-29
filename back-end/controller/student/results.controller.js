import db from "../../database/mysql_database.js";

// GET results
export const getResults = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student id using user_id
    const [studentRows] = await db.execute(
      "SELECT id FROM students WHERE user_id = ?",
      [userId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentId = studentRows[0].id;

    // Get marks + unit details
    const query = `
      SELECT 
        m.id,
        m.cat_mark,
        m.exam_mark,
        m.total,
        m.grade,
        m.is_locked,
        m.created_at,
        u.unit_code,
        u.unit_name,
        u.module,
        u.course_code
      FROM marks m
      JOIN units u ON m.unit_id = u.unit_id
      WHERE m.student_id = ?
      ORDER BY u.unit_code ASC
    `;

    const [results] = await db.execute(query, [studentId]);

    // Optional: handle empty results
    if (results.length === 0) {
      return res.status(200).json({ message: "No results found", data: [] });
    }

    res.status(200).json(results);

  } catch (err) {
    console.error("Get Results Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};