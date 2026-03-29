import db from "../../database/mysql_database.js";
import moment from "moment";

// CREATE course
export const addCourse = async (req, res) => {
  try {
    const { course_code, course_name } = req.body;
    if (!course_code || !course_name) {
      return res.status(400).json({ error: "Course code and course name are required" });
    }

    // Check if course already exists
    const [existing] = await db.execute("SELECT course_id FROM courses WHERE course_code = ?", [course_code]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Course with this code already exists" });
    }

    const insertQuery = `
      INSERT INTO courses(course_code, course_name, createdAt)
      VALUES (?, ?, ?)
    `;
    const values = [course_code, course_name, moment().format("YYYY-MM-DD HH:mm:ss")];
    const [result] = await db.execute(insertQuery, values);

    res.status(201).json({
      success: true,
      message: "Course has been created",
      course_id: result.insertId,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// GET dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [coursesRows] = await db.execute("SELECT COUNT(*) AS total FROM courses");
    const [unitsRows] = await db.execute("SELECT COUNT(*) AS total FROM units");
    const [studentsRows] = await db.execute("SELECT COUNT(*) AS total FROM students");

    res.json({
      totalCourses: coursesRows[0].total,
      units: unitsRows[0].total,
      activeStudents: studentsRows[0].total,
      pendingApprovals: 0,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

// GET all courses
export const getCourses = async (req, res) => {
  try {
    const [results] = await db.execute("SELECT course_id, course_code, course_name FROM courses");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET course by ID
export const getCourseById = async (req, res) => {
  try {
    const [results] = await db.execute(
      "SELECT course_id, course_code, course_name FROM courses WHERE course_id = ?",
      [req.params.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE course
export const updateCourse = async (req, res) => {
  try {
    const { course_code, course_name } = req.body;
    const { id } = req.params;

    if (!course_code || !course_name) {
      return res.status(400).json({ error: "Course code and course name are required" });
    }

    const [existing] = await db.execute(
      "SELECT course_id FROM courses WHERE course_code = ? AND course_id != ?",
      [course_code, id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Another course with this code already exists" });
    }

    const updateQuery = `
      UPDATE courses
      SET course_code = ?, course_name = ?, updatedAt = ?
      WHERE course_id = ?
    `;
    const values = [course_code, course_name, moment().format("YYYY-MM-DD HH:mm:ss"), id];
    const [result] = await db.execute(updateQuery, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ success: true, message: "Course updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE course
export const deleteCourse = async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM courses WHERE course_id = ?", [req.params.id]);
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};