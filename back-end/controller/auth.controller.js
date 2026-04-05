import db from "../database/mysql_database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/env.js";
import moment from "moment";

const ALLOWED_ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];

// Blacklisted tokens store (use Redis in production)
let tokenBlacklist = new Set();

// Clean up blacklisted tokens periodically (every hour)
setInterval(() => {
  tokenBlacklist.clear();
}, 60 * 60 * 1000);

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
      `SELECT id, first_name, middle_name, last_name, email, password, role, deleted_at 
       FROM users 
       WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!results.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    
    // Check if user is deleted
    if (user.deleted_at) {
      return res.status(401).json({ 
        error: "Account has been deactivated. Please contact administrator.",
        deleted: true 
      });
    }
    
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let studentData = null;

    // If student, fetch student record using user_id
    if (user.role === "student") {
      const [student] = await db.execute(
        "SELECT id, reg_no, course_id FROM students WHERE user_id = ? AND deleted_at IS NULL",
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
      student: studentData,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

/** LOGOUT USER */
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Add token to blacklist
      tokenBlacklist.add(token);
      
      // Log logout action
      if (req.user) {
        await db.execute(
          `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [req.user.id, "LOGOUT", req.user.id, "User logged out successfully"]
        );
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ error: "Error during logout", details: err.message });
  }
};

/** MIDDLEWARE: Check if token is blacklisted */
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/** MIDDLEWARE: Check if user is deleted */
export const checkUserDeleted = async (req, res, next) => {
  try {
    const [users] = await db.execute(
      "SELECT deleted_at FROM users WHERE id = ?",
      [req.user.id]
    );
    
    if (users.length > 0 && users[0].deleted_at) {
      // User is deleted, force logout
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        tokenBlacklist.add(token);
      }
      return res.status(401).json({ 
        error: "Account has been deactivated", 
        deleted: true,
        forceLogout: true 
      });
    }
    
    next();
  } catch (err) {
    console.error("Check User Deleted Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/** GET ALL ACTIVE USERS (excluding soft deleted) */
export const getUsers = async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [users] = await connection.execute(
      `SELECT id, first_name, middle_name, last_name, email, role, gender, created_at 
       FROM users 
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/** GET USER BY ID (only if not deleted) */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await db.getConnection();
    
    const [users] = await connection.execute(
      `SELECT u.id, u.first_name, u.middle_name, u.last_name, u.email, u.role, u.created_at,
              s.id as student_id, s.reg_no, s.course_id, c.course_name, c.course_code
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id AND s.deleted_at IS NULL
       LEFT JOIN courses c ON s.course_id = c.course_id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (err) {
    console.error("Get User By ID Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/** GET USERS WITH STUDENT DETAILS (excluding soft deleted) */
export const getUsersWithStudentDetails = async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [users] = await connection.execute(
      `SELECT 
        u.id, 
        u.first_name, 
        u.middle_name, 
        u.last_name, 
        u.email, 
        u.role, 
        u.created_at,
        s.id as student_id,
        s.reg_no,
        s.course_id,
        c.course_name,
        c.course_code
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id AND s.deleted_at IS NULL
       LEFT JOIN courses c ON s.course_id = c.course_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("Get Users With Student Details Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/** GET USERS BY ROLE (excluding soft deleted) */
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const connection = await db.getConnection();
    
    const [users] = await connection.execute(
      `SELECT id, first_name, middle_name, last_name, email, role, created_at 
       FROM users 
       WHERE role = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [role]
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("Get Users By Role Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/** SEARCH USERS (excluding soft deleted) */
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const connection = await db.getConnection();
    
    const [users] = await connection.execute(
      `SELECT id, first_name, middle_name, last_name, email, role, created_at 
       FROM users 
       WHERE deleted_at IS NULL 
       AND (
         first_name LIKE ? OR 
         last_name LIKE ? OR 
         email LIKE ? OR 
         CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?
       )
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("Search Users Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/** GET USER STATISTICS */
export const getUserStatistics = async (req, res) => {
  try {
    const connection = await db.getConnection();
    
    const [activeUsers] = await connection.execute(
      `SELECT role, COUNT(*) as count 
       FROM users 
       WHERE deleted_at IS NULL 
       GROUP BY role`
    );
    
    const [deletedUsers] = await connection.execute(
      `SELECT role, COUNT(*) as count 
       FROM users 
       WHERE deleted_at IS NOT NULL 
       GROUP BY role`
    );
    
    const [totalStats] = await connection.execute(
      `SELECT 
        SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted_count,
        COUNT(*) as total_count
       FROM users`
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      statistics: {
        total: totalStats[0],
        active: {
          by_role: activeUsers,
          total: activeUsers.reduce((sum, role) => sum + parseInt(role.count), 0)
        },
        deleted: {
          by_role: deletedUsers,
          total: deletedUsers.reduce((sum, role) => sum + parseInt(role.count), 0)
        }
      }
    });
  } catch (err) {
    console.error("Get User Statistics Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/** GENERATE REGISTRATION NUMBER */
const generateRegNo = async (connection, courseId, courseCode, maxRetries = 5) => {
  const year = moment().format("YYYY");
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [maxRegResult] = await connection.execute(
        `SELECT reg_no FROM students 
         WHERE course_id = ? AND YEAR(createdAt) = ? AND deleted_at IS NULL
         ORDER BY CAST(SUBSTRING_INDEX(reg_no, '/', -1) AS UNSIGNED) DESC
         LIMIT 1 FOR UPDATE`,
        [courseId, year]
      );
      
      let nextNumber = 1;
      if (maxRegResult.length > 0) {
        const lastRegNo = maxRegResult[0].reg_no;
        const lastNumber = parseInt(lastRegNo.split('/').pop());
        nextNumber = lastNumber + 1;
      }
      
      const reg_no = `JP/${courseCode}/${year}/${String(nextNumber).padStart(3, "0")}`;
      
      const [existingCheck] = await connection.execute(
        "SELECT reg_no FROM students WHERE reg_no = ? AND deleted_at IS NULL",
        [reg_no]
      );
      
      if (existingCheck.length === 0) {
        return reg_no;
      } else {
        console.log(`Generated reg_no ${reg_no} already exists, retrying...`);
        continue;
      }
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`, error.message);
    }
  }
  
  throw new Error('Failed to generate unique registration number after maximum retries');
};

/** INITIALIZE STUDENT FEE BALANCES */
/** INITIALIZE STUDENT FEE BALANCES */
const initializeStudentFeeBalances = async (connection, student_id, course_id, courseDuration) => {
  try {
    // Check if course_fees table exists
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'course_fees'"
    );
    
    if (tables[0].count === 0) {
      console.warn("course_fees table doesn't exist. Skipping fee balance initialization.");
      return;
    }
    
    // Get course fees for the selected course
    const [courseFees] = await connection.execute(
      `SELECT cf.id, cf.course_id, cf.term, cf.amount, cf.currency, cf.fee_type_id, cf.module
       FROM course_fees cf
       WHERE cf.course_id = ?
       ORDER BY cf.term, cf.module`,
      [course_id]
    );
    
    if (courseFees.length === 0) {
      console.warn(`No fee structure found for course ${course_id}. Skipping fee balance initialization.`);
      return;
    }
    
    const numberOfTerms = courseDuration || 8;
    
    // Group fees by term
    const feesByTerm = {};
    for (const fee of courseFees) {
      const term = fee.term;
      if (!feesByTerm[term]) {
        feesByTerm[term] = [];
      }
      feesByTerm[term].push(fee);
    }
    
    // Check if student_fee_balances table exists
    const [balanceTable] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'student_fee_balances'"
    );
    
    if (balanceTable[0].count === 0) {
      console.warn("student_fee_balances table doesn't exist. Skipping fee balance initialization.");
      return;
    }
    
    // Insert fee balances for each term
    for (let term = 1; term <= numberOfTerms; term++) {
      const feesForTerm = feesByTerm[term] || [];
      
      if (feesForTerm.length === 0) {
        console.log(`No fees configured for term ${term}, skipping...`);
        continue;
      }
      
      for (const fee of feesForTerm) {
        const totalAmount = parseFloat(fee.amount);
        
        await connection.execute(
          `INSERT INTO student_fee_balances 
           (student_id, course_id, term, fee_type_id, total_fee, amount_paid, balance, module, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())`,
          [
            student_id,
            course_id,
            term,
            fee.fee_type_id,
            totalAmount,
            totalAmount,
            fee.module || term
          ]
        );
      }
    }
    
    console.log(`Initialized fee balances for student ${student_id} with ${numberOfTerms} terms/modules`);
    
  } catch (error) {
    console.error("Error initializing fee balances:", error);
    // Don't throw - allow registration to continue
    console.warn("Fee balance initialization failed but continuing with registration");
  }
};
/** REGISTER NEW USER */
/** REGISTER NEW USER */
export const registerUser = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let { first_name, middle_name, last_name, email, password, role, gender } = req.body;
    email = email?.trim().toLowerCase();
    role = role?.trim().toLowerCase();

    if (!first_name || !last_name || !email || !password || !role) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Invalid role" });
    }

    const [existingUser] = await connection.execute(
      "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL FOR UPDATE",
      [email]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.execute(
      `INSERT INTO users 
       (first_name, middle_name, last_name, email, password, role, gender, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [first_name, middle_name || null, last_name, email, hashedPassword, role, gender || null]
    );

    const user_id = userResult.insertId;
    let reg_no = null;
    let student_id = null;

    if (role === "student") {
      const { course_id } = req.body;
      if (!course_id) {
        throw new Error("course_id is required for student creation");
      }

      const [courseResults] = await connection.execute(
        "SELECT course_code, course_name FROM courses WHERE course_id = ?",
        [course_id]
      );
      if (!courseResults.length) {
        throw new Error("Invalid course_id");
      }

      const courseCode = courseResults[0].course_code;
      
      reg_no = await generateRegNo(connection, course_id, courseCode);

      const [studentResult] = await connection.execute(
        `INSERT INTO students
        (user_id, reg_no, first_name, middle_name, last_name, email, course_id, gender, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          reg_no,
          first_name,
          middle_name || null,
          last_name,
          email,
          course_id,
          gender || null,
          moment().format("YYYY-MM-DD HH:mm:ss"),
        ]
      );
      
      student_id = studentResult.insertId;

      // Skip fee initialization since you don't need it
      // await initializeStudentFeeBalances(connection, student_id, course_id, courseDuration);
      console.log(`Student ${student_id} created successfully without fee balances`);
    }

    const actorId = req.user?.id || user_id;
    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        actorId,
        "CREATE_USER",
        user_id,
        `Created ${role} user${role === "student" ? ` with registration number ${reg_no}` : ""}`,
      ]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user_id,
      student_id,
      reg_no,
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Register User Error:", err);
    
    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('students.reg_no')) {
      return res.status(409).json({ 
        error: "Registration number conflict. Please try again.",
        details: "The system encountered a duplicate registration number. This has been handled automatically - please retry."
      });
    }
    
    res.status(500).json({ error: err.message });
  }
};
/** UPDATE USER BY ADMIN */
export const updateUserByAdmin = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { first_name, middle_name, last_name, email, newPassword, gender } = req.body; // Add gender

    const updateFields = [];
    const updateValues = [];

    if (first_name) { updateFields.push("first_name = ?"); updateValues.push(first_name); }
    if (middle_name !== undefined) { updateFields.push("middle_name = ?"); updateValues.push(middle_name); }
    if (last_name) { updateFields.push("last_name = ?"); updateValues.push(last_name); }
    if (email) { updateFields.push("email = ?"); updateValues.push(email); }
    if (gender) { updateFields.push("gender = ?"); updateValues.push(gender); } // Add gender update
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Provide data to update" });
    }

    await connection.beginTransaction();

    const userQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ? AND deleted_at IS NULL`;
    updateValues.push(id);
    const [userUpdateResult] = await connection.execute(userQuery, updateValues);
    
    if (userUpdateResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "User not found or has been deleted" });
    }

    // Also update the students table if the user is a student
    const [studentRows] = await connection.execute(
      "SELECT id FROM students WHERE user_id = ? AND deleted_at IS NULL",
      [id]
    );

    if (studentRows.length > 0) {
      const studentFields = [];
      const studentValues = [];

      if (first_name) { studentFields.push("first_name = ?"); studentValues.push(first_name); }
      if (middle_name !== undefined) { studentFields.push("middle_name = ?"); studentValues.push(middle_name); }
      if (last_name) { studentFields.push("last_name = ?"); studentValues.push(last_name); }
      if (email) { studentFields.push("email = ?"); studentValues.push(email); }
      if (gender) { studentFields.push("gender = ?"); studentValues.push(gender); } // Add gender to students table

      if (studentFields.length > 0) {
        const studentQuery = `UPDATE students SET ${studentFields.join(", ")} WHERE user_id = ? AND deleted_at IS NULL`;
        studentValues.push(id);
        await connection.execute(studentQuery, studentValues);
      }
    }

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        req.user.id,
        "UPDATE_USER",
        id,
        `Updated user fields: ${updateFields.map(f => f.split(" = ")[0]).join(", ")}${studentRows.length > 0 ? " and student table updated" : ""}`,
      ]
    );

    await connection.commit();
    connection.release();

    return res.json({ message: "User updated successfully" });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** SOFT DELETE USER BY ADMIN */
export const deleteUserByAdmin = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      "UPDATE users SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND deleted_at IS NULL",
      [req.user.id, id]
    );

    if (userResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found or already deleted" });
    }

    const [studentResult] = await connection.execute(
      "UPDATE students SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL",
      [id]
    );

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        req.user.id,
        "DELETE_USER",
        id,
        `Soft deleted user${studentResult.affectedRows > 0 ? " and their student record" : ""}`,
      ]
    );

    await connection.commit();
    connection.release();

    return res.json({
      message: "User soft deleted successfully",
      studentDeleted: studentResult.affectedRows > 0,
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** PERMANENTLY DELETE USER (Hard Delete) */
export const permanentDeleteUser = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    
    await connection.beginTransaction();
    
    // Check if user exists and is soft-deleted
    const [users] = await connection.execute(
      "SELECT id, role FROM users WHERE id = ? AND deleted_at IS NOT NULL",
      [id]
    );
    
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found or not soft-deleted" });
    }
    
    const user = users[0];
    
    // Helper function to safely delete from tables
    const safeDelete = async (tableName, columnName, value) => {
      try {
        // Check if table exists
        const [tables] = await connection.execute(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
          [tableName]
        );
        
        if (tables[0].count > 0) {
          // Check if column exists in table
          const [columns] = await connection.execute(
            "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
            [tableName, columnName]
          );
          
          if (columns[0].count > 0) {
            await connection.execute(`DELETE FROM ${tableName} WHERE ${columnName} = ?`, [value]);
            console.log(`Deleted from ${tableName} successfully`);
          } else {
            console.log(`Column ${columnName} doesn't exist in ${tableName}, skipping...`);
          }
        } else {
          console.log(`Table ${tableName} doesn't exist, skipping...`);
        }
      } catch (err) {
        console.error(`Error deleting from ${tableName}:`, err.message);
        // Don't throw - just log and continue
      }
    };
    
    if (user.role === "student") {
      // Delete from all student-related tables
      await safeDelete("fee_payments", "student_id", id);
      await safeDelete("student_fee_balances", "student_id", id);
      await safeDelete("student_balances", "student_id", id);
      await safeDelete("student_progressions", "student_id", id);
      await safeDelete("students", "id", id);
      await safeDelete("student_units", "student_id", id);
      await safeDelete("enrollments", "student_id", id);
      await safeDelete("exam_results", "student_id", id);
      await safeDelete("attendance", "student_id", id);
    }
    
    if (user.role === "tutor") {
      await safeDelete("course_assignments", "tutor_id", id);
    }
    
    // Finally, permanently delete the user
    await connection.execute("DELETE FROM users WHERE id = ?", [id]);
    
    // Try to log the action
    try {
      await safeDelete("audit_logs", "user_id", req.user.id);
      await connection.execute(
        "INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
        [req.user.id, "PERMANENT_DELETE_USER", `Permanently deleted user ${id}`, req.ip]
      );
    } catch (logError) {
      console.warn("Could not log to audit_logs:", logError.message);
    }
    
    await connection.commit();
    res.status(200).json({ message: "User permanently deleted successfully" });
    
  } catch (error) {
    await connection.rollback();
    console.error("Error in permanentDeleteUser:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

/** GET SOFT-DELETED USERS */
export const getDeletedUsers = async (req, res) => {
  try {
    const [results] = await db.execute(
      `SELECT id, first_name, middle_name, last_name, email, role, created_at, deleted_at, deleted_by
       FROM users 
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`
    );

    return res.json({ 
      success: true,
      count: results.length,
      users: results 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** RESTORE USER BY ADMIN */
export const restoreUserByAdmin = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      "UPDATE users SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL",
      [id]
    );

    if (userResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found or not deleted" });
    }

    const [studentResult] = await connection.execute(
      "UPDATE students SET deleted_at = NULL WHERE user_id = ? AND deleted_at IS NOT NULL",
      [id]
    );

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        req.user.id,
        "RESTORE_USER",
        id,
        `Restored user${studentResult.affectedRows > 0 ? " and their student record" : ""}`,
      ]
    );

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: "User restored successfully",
      studentRestored: studentResult.affectedRows > 0,
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};

/** GET CURRENT LOGGED-IN USER */
export const getCurrentUser = async (req, res) => {
  try {
    const [results] = await db.execute(
      "SELECT id, first_name, middle_name, last_name, email, role FROM users WHERE id = ? AND deleted_at IS NULL",
      [req.user.id]
    );

    if (!results.length) {
      return res.status(404).json({ error: "User not found or deactivated" });
    }

    const user = results[0];

    let studentData = null;
    if (user.role === "student") {
      const [studentRows] = await db.execute(
        "SELECT id, reg_no, course_id FROM students WHERE user_id = ? AND deleted_at IS NULL",
        [user.id]
      );
      studentData = studentRows[0] || null;
    }

    return res.json({
      user,
      student: studentData,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

/** GET AUDIT LOGS */
export const getAuditLogs = async (req, res) => {
  try {
    const [logs] = await db.execute(`
      SELECT 
        a.id,
        a.user_id,
        CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.last_name) AS performed_by,
        a.action,
        a.target_id,
        a.created_at,
        a.details
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    return res.json({ 
      success: true,
      count: logs.length,
      logs 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
};