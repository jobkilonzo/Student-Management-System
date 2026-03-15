import db from "../../database/mysql_database.js";
import moment from "moment";


// CREATE course
export const addCourse = (req, res) => {
  const { course_code, course_name } = req.body;

  if (!course_code || !course_name) {
    return res.status(400).json({
      error: "Course code and course name are required",
    });
  }

  const checkQuery = "SELECT course_id FROM courses WHERE course_code = ?";

  db.query(checkQuery, [course_code], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(409).json({
        error: "Course with this code already exists",
      });
    }

    const insertQuery = `
      INSERT INTO courses(course_code, course_name, createdAt)
      VALUES(?, ?, ?)
    `;

    const values = [
      course_code,
      course_name,
      moment().format("YYYY-MM-DD HH:mm:ss"),
    ];

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(201).json({
        success: true,
        message: "Course has been created",
        course_id: result.insertId,
      });
    });
  });
};



// DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {

    const [courses] = await db.query(
      "SELECT COUNT(*) AS total FROM courses"
    );

    const [units] = await db.query(
      "SELECT COUNT(*) AS total FROM units"
    );

    const [students] = await db.query(
      "SELECT COUNT(*) AS total FROM students"
    );

    res.json({
      courses: courses[0].total,
      units: units[0].total,
      students: students[0].total,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};


// GET all courses
export const getCourses = (req, res) => {
  const qs = `
    SELECT course_id, course_code, course_name
    FROM courses
  `;

  db.query(qs, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};



// GET course by ID
export const getCourseById = (req, res) => {

  const qs = `
    SELECT course_id, course_code, course_name
    FROM courses
    WHERE course_id = ?
  `;

  db.query(qs, [req.params.id], (err, results) => {

    if (err) return res.status(500).json({ error: err });

    if (results.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(results[0]);
  });
};



// UPDATE course
export const updateCourse = (req, res) => {

  const { course_code, course_name } = req.body;
  const { id } = req.params;

  if (!course_code || !course_name) {
    return res.status(400).json({
      error: "Course code and course name are required",
    });
  }

  const checkQuery =
    "SELECT course_id FROM courses WHERE course_code = ? AND course_id != ?";

  db.query(checkQuery, [course_code, id], (err, results) => {

    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(409).json({
        error: "Another course with this code already exists",
      });
    }

    const updateQuery = `
      UPDATE courses
      SET course_code = ?, course_name = ?, updatedAt = ?
      WHERE course_id = ?
    `;

    const values = [
      course_code,
      course_name,
      moment().format("YYYY-MM-DD HH:mm:ss"),
      id,
    ];

    db.query(updateQuery, values, (err, result) => {

      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Course not found" });
      }

      res.json({
        success: true,
        message: "Course updated successfully",
      });
    });
  });
};



// DELETE course
export const deleteCourse = (req, res) => {

  const qs = "DELETE FROM courses WHERE course_id = ?";

  db.query(qs, [req.params.id], (err) => {

    if (err) return res.status(500).json({ error: err });

    res.json({
      success: true,
      message: "Course deleted",
    });
  });
};