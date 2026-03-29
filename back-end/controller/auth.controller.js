import db from "../database/mysql_database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";
import moment from "moment";
const ALLOWED_ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];

/** LOGIN */
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [results] = await db.execute(
      `SELECT id, first_name, middle_name, last_name, email, password, role 
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!results.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let studentData = null;

    // ✅ If student, fetch student record using user_id
    if (user.role === "student") {
      const [student] = await db.execute(
        "SELECT id, reg_no, course_id FROM students WHERE user_id = ?",
        [user.id]
      );
      studentData = student[0] || null;
    }

    const payload = {
      id: user.id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "8h" });

    return res.json({
      token,
      user: payload,
      student: studentData, // ✅ helpful for frontend
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

/** REGISTER USER (with course if student) */

export const registerUser = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let { first_name, middle_name, last_name, email, password, role } = req.body;

    email = email?.trim().toLowerCase();
    role = role?.trim().toLowerCase();

    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const ALLOWED_ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // ✅ Check existing user
    const [existingUser] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert user
    const [userResult] = await connection.execute(
      `INSERT INTO users 
       (first_name, middle_name, last_name, email, password, role, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [first_name, middle_name || null, last_name, email, hashedPassword, role]
    );

    const user_id = userResult.insertId;
    let reg_no = null;

    // ✅ If student → insert into students table
    if (role === "student") {
      const { course_id } = req.body;

      if (!course_id) {
        throw new Error("course_id is required for student creation");
      }

      const [courseResults] = await connection.execute(
        "SELECT course_code FROM courses WHERE course_id = ?",
        [course_id]
      );

      if (!courseResults.length) {
        throw new Error("Invalid course_id");
      }

      const courseCode = courseResults[0].course_code;
      reg_no = await generateRegNo(course_id, courseCode);

      await connection.execute(
        `INSERT INTO students
        (user_id, reg_no, first_name, middle_name, last_name, email, course_id, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          reg_no,
          first_name,
          middle_name || null,
          last_name,
          email,
          course_id,
          moment().format("YYYY-MM-DD HH:mm:ss"),
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user_id,
      reg_no,
    });

  } catch (err) {
    await connection.rollback();
    console.error("Register User Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// Generate registration number (same as before)
const generateRegNo = async (courseId, courseCode) => {
  const year = moment().format("YYYY");
  const [countResults] = await db.execute(
    "SELECT COUNT(*) AS total FROM students WHERE course_id=? AND YEAR(createdAt)=?",
    [courseId, year]
  );
  const nextNumber = (countResults[0].total || 0) + 1;
  return `JP/${courseCode}/${year}/${String(nextNumber).padStart(3, "0")}`;
};

/** GET ALL USERS */
export const getUsers = async (req, res) => {
  try {
    let query = `
      SELECT id, first_name, middle_name, last_name, email, role, created_at 
      FROM users
    `;

    const params = [];

    if (req.query.tutor === "true") {
      query += " WHERE role = ?";
      params.push("tutor");
    }

    query += " ORDER BY created_at DESC";

    const [results] = await db.execute(query, params);

    // map to include explicit first_name/last_name fields with name fallback
    const users = results.map((u) => ({
      ...u,
      name: [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" "),
    }));

    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** GET CURRENT USER */
export const me = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ user: req.user });
};

/** UPDATE CURRENT USER */
export const updateMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const userId = req.user.id;
    const { first_name, middle_name, last_name, email, currentPassword, newPassword } = req.body;

    if (!first_name && !last_name && !email && !newPassword) {
      return res.status(400).json({ error: "Provide data to update" });
    }

    const [results] = await db.execute(
      "SELECT password, role FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    const existingUser = results[0];

    const updateFields = [];
    const updateValues = [];

    if (first_name) { updateFields.push("first_name = ?"); updateValues.push(first_name); }
    if (middle_name !== undefined) { updateFields.push("middle_name = ?"); updateValues.push(middle_name); }
    if (last_name) { updateFields.push("last_name = ?"); updateValues.push(last_name); }
    if (email) { updateFields.push("email = ?"); updateValues.push(email); }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "currentPassword is required" });
      }

      const match = await bcrypt.compare(currentPassword, existingUser.password);
      if (!match) return res.status(401).json({ error: "Incorrect current password" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length > 0) {
      const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
      updateValues.push(userId);
      await db.execute(query, updateValues);
    }

    const updatedUser = {
      id: userId,
      first_name: first_name || req.user.first_name,
      middle_name: middle_name ?? req.user.middle_name,
      last_name: last_name || req.user.last_name,
      email: email || req.user.email,
      role: existingUser.role,
    };

    const token = jwt.sign(updatedUser, SECRET_KEY, { expiresIn: "8h" });

    return res.json({ token, user: updatedUser });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** UPDATE USER BY ADMIN */
export const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, middle_name, last_name, email, newPassword } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (first_name) { updateFields.push("first_name = ?"); updateValues.push(first_name); }
    if (middle_name !== undefined) { updateFields.push("middle_name = ?"); updateValues.push(middle_name); }
    if (last_name) { updateFields.push("last_name = ?"); updateValues.push(last_name); }
    if (email) { updateFields.push("email = ?"); updateValues.push(email); }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Provide data to update" });
    }

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(id);

    await db.execute(query, updateValues);

    return res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** DELETE USER BY ADMIN */
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && String(req.user.id) === String(id)) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};