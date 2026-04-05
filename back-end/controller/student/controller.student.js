import db from "../../database/mysql_database.js";
import moment from "moment";

// Helper function to calculate grade
const getGrade = (marks) => {
  if (marks >= 80) return "A";
  if (marks >= 75) return "A-";
  if (marks >= 70) return "B+";
  if (marks >= 65) return "B";
  if (marks >= 60) return "B-";
  if (marks >= 55) return "C+";
  if (marks >= 50) return "C";
  if (marks >= 45) return "C-";
  if (marks >= 40) return "D+";
  if (marks >= 35) return "D";
  return "E";
};

// GET student profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT s.*, c.course_name, c.course_code
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.user_id = ?
      AND s.deleted_at IS NULL
    `;

    const [results] = await db.execute(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Student not found or deleted" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const body = req.body || {};

    const {
      first_name,
      middle_name,
      last_name,
      gender,
      dob,
      id_number,
      phone,
      email,
      address,
      guardian_name,
      guardian_phone,
    } = body;

    // ✅ 1. UPDATE students table
    const studentQuery = `
      UPDATE students
      SET first_name=?, middle_name=?, last_name=?, gender=?, dob=?, 
          id_number=?, phone=?, email=?, address=?, guardian_name=?, 
          guardian_phone=?, updatedAt=?
      WHERE user_id=?
    `;

    const [studentResult] = await connection.execute(studentQuery, [
      first_name,
      middle_name || null,
      last_name,
      gender,
      dob || null,
      id_number || null,
      phone || null,
      email || null,
      address || null,
      guardian_name || null,
      guardian_phone || null,
      moment().format("YYYY-MM-DD HH:mm:ss"),
      userId,
    ]);

    if (studentResult.affectedRows === 0) {
      throw new Error("Student not found");
    }

    // ✅ 2. UPDATE users table
    const userQuery = `
      UPDATE users
      SET first_name=?, middle_name=?, last_name=?, email=?
      WHERE id=?
    `;

    await connection.execute(userQuery, [
      first_name,
      middle_name || null,
      last_name,
      email,
      userId,
    ]);

    await connection.commit();

    res.json({ success: true, message: "Profile updated successfully" });

  } catch (err) {
    await connection.rollback();
    console.error("Update Profile Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

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

// GET fee balance
export const getFeeBalance = async (req, res) => {
  try {
    const studentId = req.user.id;

    // This is a placeholder - you would need a fees table
    // For now, return dummy data
    const feeData = {
      total_fees: 50000,
      amount_paid: 30000,
      balance: 20000,
    };

    res.json(feeData);
  } catch (err) {
    console.error("Get Fee Balance Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET results
export const getResults = async (req, res) => {
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
    console.error("Get Results Error:", err);
    res.status(500).json({ error: err.message });
  }
};

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

    // Get all units for student
    const unitsQuery = `
      SELECT u.unit_id, u.unit_code, u.unit_name, c.course_name, c.course_code
      FROM units u
      JOIN courses c ON u.course_id = c.course_id
      WHERE u.course_id = (SELECT course_id FROM students WHERE id = ?)
      ORDER BY u.unit_code
    `;
    const [units] = await db.execute(unitsQuery, [studentId]);

    // Get marks for those units
    const marksQuery = `
      SELECT m.*, u.unit_code, u.unit_name
      FROM marks m
      JOIN units u ON m.unit_id = u.unit_id
      WHERE m.student_id = ?
      ORDER BY u.unit_code
    `;
    const [marks] = await db.execute(marksQuery, [studentId]);

    // Combine units with marks
    const unitsWithMarks = units.map(unit => {
      const mark = marks.find(m => m.unit_id === unit.unit_id);
      return {
        ...unit,
        marks: mark ? {
          id: mark.id,
          cat_marks: mark.cat_marks,
          end_term_marks: mark.end_term_marks,
          total_marks: mark.total_marks,
          grade: mark.grade
        } : null
      };
    });

    res.json(unitsWithMarks);
  } catch (err) {
    console.error("Get Student Marks Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE student marks with validation, timestamp, and audit
export const updateStudentMarks = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const userEmail = req.user.email;
    const { unit_id, cat_mark, exam_mark } = req.body;

    // Validate inputs
    const cat = parseFloat(cat_mark);
    const exam = parseFloat(exam_mark);

    if (isNaN(cat) || cat < 0 || cat > 30) {
      throw new Error("CAT mark must be a number between 0 and 30");
    }
    if (isNaN(exam) || exam < 0 || exam > 70) {
      throw new Error("Exam mark must be a number between 0 and 70");
    }

    const { id: studentId } = await getStudentIdByEmail(userEmail);

    const total = cat + exam;
    const grade = getGrade(total);

    const now = moment().format("YYYY-MM-DD HH:mm:ss");

    // Insert or update marks
    const query = `
      INSERT INTO marks (student_id, unit_id, cat_mark, exam_mark, total, grade, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cat_mark = VALUES(cat_mark),
        exam_mark = VALUES(exam_mark),
        total = VALUES(total),
        grade = VALUES(grade),
        updated_at = NOW()
    `;

    await connection.execute(query, [studentId, unit_id, cat, exam, total, grade, now]);

    await connection.commit();

    res.json({ success: true, message: "Marks updated successfully", total, grade });
  } catch (err) {
    await connection.rollback();
    console.error("Update Student Marks Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};