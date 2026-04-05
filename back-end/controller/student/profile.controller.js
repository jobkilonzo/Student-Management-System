import db from "../../database/mysql_database.js";
import moment from "moment";
import fs from "fs";
import path from "path";

// helper
const safe = (val) => (val === undefined || val === "" ? null : val);

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const body = req.body || {};
    const photoFile = req.file ? req.file.filename : null;

    // ✅ Normalize incoming data
    const data = {
      first_name: safe(body.first_name),
      middle_name: safe(body.middle_name),
      last_name: safe(body.last_name),
      gender: safe(body.gender),
      dob: safe(body.dob),
      id_number: safe(body.id_number),
      phone: safe(body.phone),
      email: safe(body.email),
      address: safe(body.address),
      guardian_name: safe(body.guardian_name),
      guardian_phone: safe(body.guardian_phone),
    };

    // ✅ Get existing student
    const [existingRows] = await connection.execute(
      "SELECT * FROM students WHERE user_id=?",
      [userId]
    );

    if (existingRows.length === 0) {
      throw new Error("Student not found");
    }

    const existing = existingRows[0];

    // ✅ Merge old + new (fallback)
    const finalData = {
      first_name: data.first_name ?? existing.first_name,
      middle_name: data.middle_name ?? existing.middle_name,
      last_name: data.last_name ?? existing.last_name,
      gender: data.gender ?? existing.gender,
      dob: data.dob ?? existing.dob,
      id_number: data.id_number ?? existing.id_number,
      phone: data.phone ?? existing.phone,
      email: data.email ?? existing.email,
      address: data.address ?? existing.address,
      guardian_name: data.guardian_name ?? existing.guardian_name,
      guardian_phone: data.guardian_phone ?? existing.guardian_phone,
    };

    // ✅ CHECK IF DATA CHANGED
    const isSame =
      existing.first_name === finalData.first_name &&
      existing.middle_name === finalData.middle_name &&
      existing.last_name === finalData.last_name &&
      existing.gender === finalData.gender &&
      String(existing.dob || "") === String(finalData.dob || "") &&
      existing.id_number === finalData.id_number &&
      existing.phone === finalData.phone &&
      existing.email === finalData.email &&
      existing.address === finalData.address &&
      existing.guardian_name === finalData.guardian_name &&
      existing.guardian_phone === finalData.guardian_phone &&
      !photoFile;

    if (isSame) {
      await connection.rollback();
      return res.json({
        success: true,
        message: "No data changed",
      });
    }

    // ✅ Delete old photo if new one uploaded
    if (photoFile && existing.photo) {
      const oldPath = path.join("uploads", existing.photo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // ✅ UPDATE students
    let studentQuery = `
      UPDATE students
      SET first_name=?, middle_name=?, last_name=?, gender=?, dob=?,
          id_number=?, phone=?, email=?, address=?, guardian_name=?,
          guardian_phone=?, updatedAt=?
    `;

    const studentValues = [
      finalData.first_name,
      finalData.middle_name,
      finalData.last_name,
      finalData.gender,
      finalData.dob,
      finalData.id_number,
      finalData.phone,
      finalData.email,
      finalData.address,
      finalData.guardian_name,
      finalData.guardian_phone,
      moment().format("YYYY-MM-DD HH:mm:ss"),
    ];

    if (photoFile) {
      studentQuery += ", photo=?";
      studentValues.push(photoFile);
    }

    studentQuery += " WHERE user_id=?";
    studentValues.push(userId);

    const [studentResult] = await connection.execute(studentQuery, studentValues);

    if (studentResult.affectedRows === 0) {
      throw new Error("Student not found");
    }

    // ✅ UPDATE users table
    await connection.execute(
      `
      UPDATE users
      SET first_name=?, middle_name=?, last_name=?, email=?
      WHERE id=?
      `,
      [
        finalData.first_name,
        finalData.middle_name,
        finalData.last_name,
        finalData.email,
        userId,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (err) {
    await connection.rollback();
    console.error("Update Profile Error:", err);

    res.status(500).json({
      error: err.message || "Failed to update profile",
    });
  } finally {
    connection.release();
  }
};