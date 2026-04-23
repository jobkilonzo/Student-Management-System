// middleware/auth.js
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";
import db from "../database/mysql_database.js";
import { isTokenBlacklisted } from "../controller/auth.controller.js";

const isAllowedWhileMustChangePassword = (req) => {
  const url = req.originalUrl || "";
  const method = (req.method || "GET").toUpperCase();

  // Allow changing password, checking current user, and logging out
  if (method === "POST" && url.includes("/api/v1/auth/change-password")) return true;
  if (method === "POST" && url.includes("/api/v1/auth/logout")) return true;
  if (method === "GET" && url.includes("/api/v1/auth/me")) return true;

  return false;
};

// Authenticate token & check deleted status
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token missing" });
  if (isTokenBlacklisted?.(token)) {
    return res.status(401).json({ error: "Token is invalid. Please log in again.", forceLogout: true });
  }

  jwt.verify(token, SECRET_KEY, async (err, payload) => {
    if (err) return res.status(403).json({ error: "Invalid/expired token" });

    // Check if user exists and is not deleted (and fetch must_change_password flag)
    let results;
    try {
      const [rows] = await db.execute(
        "SELECT id, role, deleted_at, must_change_password FROM users WHERE id = ?",
        [payload.id]
      );
      results = rows;
    } catch (err) {
      if (err?.code !== "ER_BAD_FIELD_ERROR") {
        console.error("Auth user lookup error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      const [rows] = await db.execute(
        "SELECT id, role, deleted_at FROM users WHERE id = ?",
        [payload.id]
      );
      results = rows;
    }

    if (!results.length || results[0].deleted_at) {
      return res.status(403).json({ error: "Account is deleted. Please contact admin." });
    }

    const dbUser = results[0];
    req.user = { ...payload, role: dbUser.role, must_change_password: Boolean(dbUser.must_change_password) };

    if (req.user.must_change_password && !isAllowedWhileMustChangePassword(req)) {
      return res.status(403).json({
        error: "Password change required",
        code: "MUST_CHANGE_PASSWORD",
        must_change_password: true,
      });
    }
    next();
  });
};

// Role-based authorization
export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const userRole = req.user.role?.toLowerCase().trim();
  const normalizedRoles = allowedRoles.map((r) => r.toLowerCase().trim());

  if (!normalizedRoles.includes(userRole)) {
    console.log("ACCESS DENIED:", userRole, "Allowed roles:", normalizedRoles);
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};