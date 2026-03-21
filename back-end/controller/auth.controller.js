import db from "../database/mysql_database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";

const ALLOWED_ROLES = [
  "admin",
  "registrar",
  "student",
  "accountant",
  "tutor",
];

export const login = (req, res) => {
  let { email, password } = req.body;
  email = email?.trim().toLowerCase();
  password = password?.trim();

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const query = "SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1";
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    if (!results || results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (bcryptErr, match) => {
      if (bcryptErr) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "8h" });

      return res.json({ token, user: payload });
    });
  });
};

export const registerUser = (req, res) => {
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

  // Admin should not be created via this endpoint
  if (role === "admin") {
    return res.status(403).json({ error: "Cannot create admin user via this endpoint" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const insertQuery = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
  db.query(insertQuery, [name, email, hashedPassword, role], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Email already in use" });
      }
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    return res.status(201).json({
      message: "User created",
      user: { id: result.insertId, name, email, role },
    });
  });
};

export const getUsers = (req, res) => {
  const query = "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    return res.json({ users: results });
  });
};

export const me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ user: req.user });
};

export const updateMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.id;
  const { name, email, currentPassword, newPassword } = req.body;

  if (!name && !email && !newPassword) {
    return res.status(400).json({ error: "Please provide data to update (name, email or newPassword)." });
  }

  const getUserQuery = "SELECT email, password, role FROM users WHERE id = ? LIMIT 1";
  db.query(getUserQuery, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = results[0];

    const updateUser = (hashedPassword) => {
      const fields = [];
      const values = [];

      if (name) {
        fields.push("name = ?");
        values.push(name);
      }
      if (email) {
        fields.push("email = ?");
        values.push(email);
      }
      if (hashedPassword) {
        fields.push("password = ?");
        values.push(hashedPassword);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update." });
      }

      const updateQuery = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
      values.push(userId);

      db.query(updateQuery, values, (updateErr) => {
        if (updateErr) {
          if (updateErr.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email already in use" });
          }
          return res.status(500).json({ error: "Database error", details: updateErr.message });
        }

        const updatedUser = {
          id: userId,
          name: name || req.user.name,
          email: email || req.user.email,
          role: existingUser.role,
        };

        const token = jwt.sign(updatedUser, SECRET_KEY, { expiresIn: "8h" });

        return res.json({ token, user: updatedUser });
      });
    };

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "currentPassword is required to change password" });
      }

      bcrypt.compare(currentPassword, existingUser.password, (bcryptErr, match) => {
        if (bcryptErr) {
          return res.status(500).json({ error: "Authentication error" });
        }
        if (!match) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        updateUser(hashedPassword);
      });
    } else {
      updateUser();
    }
  });
};

export const updateUserByAdmin = (req, res) => {
  const { id } = req.params;
  const { name, email, newPassword } = req.body;

  if (!name && !email && !newPassword) {
    return res.status(400).json({ error: "Please provide data to update (name, email or newPassword)." });
  }

  const updateUser = (hashedPassword) => {
    const fields = [];
    const values = [];

    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (email) {
      fields.push("email = ?");
      values.push(email);
    }
    if (hashedPassword) {
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update." });
    }

    const updateQuery = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    db.query(updateQuery, values, (updateErr) => {
      if (updateErr) {
        if (updateErr.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Email already in use" });
        }
        return res.status(500).json({ error: "Database error", details: updateErr.message });
      }

      return res.json({ message: "User updated successfully" });
    });
  };

  if (newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    updateUser(hashedPassword);
  } else {
    updateUser();
  }
};

export const deleteUserByAdmin = (req, res) => {
  const { id } = req.params;

  if (req.user && String(req.user.id) === String(id)) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  const deleteQuery = "DELETE FROM users WHERE id = ?";
  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "User deleted successfully" });
  });
};
