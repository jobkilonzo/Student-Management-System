
import db from "../../database/mysql_database.js"
import moment from "moment";

// CREATE course
export const addCourse = (req, res) => {
  const qs = `INSERT INTO courses(code, name, createdAt)
              VALUES(?, ?, ?)`;
  const values = [
    req.body.code,
    req.body.name,
    moment().format("YYYY-MM-DD HH:mm:ss"),
  ];

  db.query(qs, values, (err, result) => {
    if (err) {
      console.error("Database error: ", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    // Return created course ID for adding units
    return res.status(201).json({
      success: true,
      message: "Course has been created",
      id: result.insertId,
    });
  });
};

// GET all courses
export const getCourses = (req, res) => {
  const qs = "SELECT * FROM courses";
  db.query(qs, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// GET course by ID
export const getCourseById = (req, res) => {
  const qs = "SELECT * FROM courses WHERE id = ?";
  db.query(qs, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ error: "Course not found" });
    res.json(results[0]);
  });
};

// UPDATE course by ID
export const updateCourse = (req, res) => {
  const { code, name } = req.body;
  const { id } = req.params;

  const qs = `UPDATE courses 
              SET code = ?, name = ?, updatedAt = ? 
              WHERE id = ?`;

  const values = [
    code,
    name,
    moment().format("YYYY-MM-DD HH:mm:ss"),
    id,
  ];

  db.query(qs, values, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Course not found" });

    return res.json({
      success: true,
      message: "Course updated successfully",
    });
  });
};

// DELETE course
export const deleteCourse = (req, res) => {
  const qs = "DELETE FROM courses WHERE id = ?";
  db.query(qs, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Course deleted" });
  });
};


//units
