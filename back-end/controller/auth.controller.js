import db from "../database/mysql_database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";

const ALLOWED_ROLES = ["admin", "registrar", "student", "accountant", "tutor"];

/** LOGIN */
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const query = "SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1";
    const [results] = await db.execute(query, [email]);

    if (!results || results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "8h" });

    return res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

/** REGISTER USER */
export const registerUser = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    name = name?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "name, email, password and role are required" });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (role === "admin") {
      return res.status(403).json({ error: "Cannot create admin user via this endpoint" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    const [result] = await db.execute(insertQuery, [name, email, hashedPassword, role]);

    return res.status(201).json({
      message: "User created",
      user: { id: result.insertId, name, email, role },
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already in use" });
    }
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** GET ALL USERS */
export const getUsers = async (req, res) => {
  try {
    const query = "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC";
    const [results] = await db.execute(query);
    return res.json({ users: results });
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
    const { name, email, currentPassword, newPassword } = req.body;

    if (!name && !email && !newPassword) {
      return res.status(400).json({ error: "Provide data to update (name, email, newPassword)" });
    }

    const getUserQuery = "SELECT email, password, role FROM users WHERE id = ? LIMIT 1";
    const [results] = await db.execute(getUserQuery, [userId]);
    if (!results || results.length === 0) return res.status(404).json({ error: "User not found" });

    const existingUser = results[0];

    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push("name = ?"); updateValues.push(name); }
    if (email) { updateFields.push("email = ?"); updateValues.push(email); }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: "currentPassword is required to change password" });

      const match = await bcrypt.compare(currentPassword, existingUser.password);
      if (!match) return res.status(401).json({ error: "Current password is incorrect" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push("password = ?"); updateValues.push(hashedPassword);
    }

    if (updateFields.length > 0) {
      const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
      updateValues.push(userId);
      await db.execute(updateQuery, updateValues);
    }

    const updatedUser = {
      id: userId,
      name: name || req.user.name,
      email: email || req.user.email,
      role: existingUser.role,
    };

    const token = jwt.sign(updatedUser, SECRET_KEY, { expiresIn: "8h" });
    return res.json({ token, user: updatedUser });

  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already in use" });
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** UPDATE USER BY ADMIN */
export const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, newPassword } = req.body;

    if (!name && !email && !newPassword) return res.status(400).json({ error: "Provide data to update" });

    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push("name = ?"); updateValues.push(name); }
    if (email) { updateFields.push("email = ?"); updateValues.push(email); }
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push("password = ?"); updateValues.push(hashedPassword);
    }

    const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(id);

    await db.execute(updateQuery, updateValues);

    return res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email already in use" });
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

    const deleteQuery = "DELETE FROM users WHERE id = ?";
    const [result] = await db.execute(deleteQuery, [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};