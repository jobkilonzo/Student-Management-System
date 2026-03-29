import db from "../../database/mysql_database.js";

// GET student marks
export const getStudentMarks = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get student id
    const [studentResults] = await db.execute("SELECT id FROM students WHERE email = ?", [userEmail]);
    if (studentResults.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const studentId = studentResults[0].id;

    // Get marks for student's units
    const query = `
      SELECT m.*, u.unit_code, u.unit_name
      FROM marks m
      JOIN units u ON m.unit_id = u.unit_id
      WHERE m.student_id = ?
      ORDER BY u.unit_code
    `;
    const [results] = await db.execute(query, [studentId]);

    res.json(results);
  } catch (err) {
    console.error("Get Student Marks Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE student marks (for students to update their own marks if needed)
export const updateStudentMarks = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { unit_id, cat_marks, end_term_marks } = req.body;

    // Get student id
    const [studentResults] = await db.execute("SELECT id FROM students WHERE email = ?", [userEmail]);
    if (studentResults.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const studentId = studentResults[0].id;

    // Update marks
    const query = `
      UPDATE marks
      SET cat_marks = ?, end_term_marks = ?
      WHERE student_id = ? AND unit_id = ?
    `;
    const [result] = await db.execute(query, [cat_marks, end_term_marks, studentId, unit_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Marks not found for this unit" });
    }

    res.json({ message: "Marks updated successfully" });
  } catch (err) {
    console.error("Update Student Marks Error:", err);
    res.status(500).json({ error: err.message });
  }
};