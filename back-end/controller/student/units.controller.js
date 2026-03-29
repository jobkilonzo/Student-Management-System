import db from "../../database/mysql_database.js";

// GET assigned units
export const getAssignedUnits = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get student's course_id
    const [studentResults] = await db.execute(
      "SELECT course_id FROM students WHERE email = ?",
      [userEmail]
    );

    if (studentResults.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const courseId = studentResults[0].course_id;

    // Get units for the course
    const query = `
      SELECT u.unit_id, u.unit_code, u.unit_name, c.course_name, c.course_code
      FROM units u
      LEFT JOIN courses c ON u.course_id = c.course_id
      WHERE u.course_id = ?
      ORDER BY u.unit_code
    `;
    const [results] = await db.execute(query, [courseId]);

    res.json(results);
  } catch (err) {
    console.error("Get Assigned Units Error:", err);
    res.status(500).json({ error: err.message });
  }
};