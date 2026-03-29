import db from "../../database/mysql_database.js";
import moment from "moment";

// GET student profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ use ID

    const query = `
      SELECT s.*, c.course_name, c.course_code
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.user_id = ?
    `;

    const [results] = await db.execute(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Student not found" });
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
    const photoPath = req.file ? req.file.path : null;

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
    let studentQuery = `
      UPDATE students
      SET first_name=?, middle_name=?, last_name=?, gender=?, dob=?,
          id_number=?, phone=?, email=?, address=?, guardian_name=?,
          guardian_phone=?, updatedAt=?
    `;

    const studentValues = [
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
    ];

    if (photoPath) {
      studentQuery += ", photo=?";
      studentValues.push(photoPath);
    }

    studentQuery += " WHERE user_id=?";
    studentValues.push(userId);

    const [studentResult] = await connection.execute(studentQuery, studentValues);

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