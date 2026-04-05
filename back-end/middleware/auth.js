// middleware/auth.js
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";
import db from "../database/mysql_database.js";

// Authenticate token & check deleted status
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, SECRET_KEY, async (err, payload) => {
    if (err) return res.status(403).json({ error: "Invalid/expired token" });

    // Check if user exists and is not deleted
    const [results] = await db.execute(
      "SELECT id, role, deleted_at FROM users WHERE id = ?",
      [payload.id]
    );

    if (!results.length || results[0].deleted_at) {
      return res.status(403).json({ error: "Account is deleted. Please contact admin." });
    }

    req.user = payload;
    next();
  });
};

// Role-based authorization
export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  next();
};