import db from "../../database/mysql_database.js";
import moment from "moment";

// CREATE course
export const addCourse = async (req, res) => {
  try {
    const { course_code, course_name, course_type, course_category = 'Technical' } = req.body;
    
    // Validate required fields
    if (!course_code || !course_name || !course_type) {
      return res.status(400).json({ 
        error: "Course code, course name, and course type are required" 
      });
    }

    // Validate course_type value
    const validCourseTypes = ['non_modular', 'stage_based', 'modular', 'level_based', 'grade_based'];
    if (!validCourseTypes.includes(course_type)) {
      return res.status(400).json({ 
        error: "Invalid course type. Must be one of: " + validCourseTypes.join(', ') 
      });
    }

    const validCourseCategories = ['Technical', 'Business'];
    if (!validCourseCategories.includes(course_category)) {
      return res.status(400).json({ 
        error: "Invalid course category. Must be Technical or Business" 
      });
    }

    // Check if course already exists
    const [existing] = await db.execute(
      "SELECT course_id FROM courses WHERE course_code = ?", 
      [course_code]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: "Course with this code already exists" });
    }

    const insertQuery = `
      INSERT INTO courses(course_code, course_name, course_type, course_category, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [course_code, course_name, course_type, course_category, moment().format("YYYY-MM-DD HH:mm:ss")];
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
    const { course_category } = req.query || {};
    let sql = "SELECT course_id, course_code, course_name, course_type, course_category FROM courses";
    const params = [];

    if (course_category) {
      sql += " WHERE course_category = ?";
      params.push(course_category);
    }

    const [results] = await db.execute(sql, params);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET course by ID
// In your course fetching endpoint, add the course_type mapping
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute("SELECT * FROM courses WHERE course_id = ?", [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const course = rows[0];
    
    // Map your database values to frontend-friendly values
    if (course.course_type === "non_modular") {
      course.course_type_mapped = "modular";
    } else if (course.course_type === "stage_based") {
      course.course_type_mapped = "stage";
    } else {
      course.course_type_mapped = course.course_type;
    }
    
    res.json(course);
  } catch (err) {
    console.error("Get Course By ID Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE course
export const updateCourse = async (req, res) => {
  try {
    const { course_code, course_name, course_type, course_category = 'Technical' } = req.body;
    const { id } = req.params;

    if (!course_code || !course_name || !course_type) {
      return res.status(400).json({ 
        error: "Course code, course name, and course type are required" 
      });
    }

    const validCourseTypes = ['non_modular', 'stage_based', 'modular', 'level_based', 'grade_based'];
    if (!validCourseTypes.includes(course_type)) {
      return res.status(400).json({ 
        error: "Invalid course type. Must be one of: " + validCourseTypes.join(', ') 
      });
    }

    const validCourseCategories = ['Technical', 'Business'];
    if (!validCourseCategories.includes(course_category)) {
      return res.status(400).json({ 
        error: "Invalid course category. Must be Technical or Business" 
      });
    }

    // Check if another course with same code exists
    const [existing] = await db.execute(
      "SELECT course_id FROM courses WHERE course_code = ? AND course_id != ?",
      [course_code, id]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: "Another course with this code already exists" });
    }

    const updateQuery = `
      UPDATE courses
      SET course_code = ?, course_name = ?, course_type = ?, course_category = ?, updatedAt = ?
      WHERE course_id = ?
    `;
    const values = [course_code, course_name, course_type, course_category, moment().format("YYYY-MM-DD HH:mm:ss"), id];
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
    // Optional: Check if course has any dependencies (units, enrollments, etc.)
    const [dependencies] = await db.execute(
      "SELECT COUNT(*) as count FROM units WHERE course_id = ?",
      [req.params.id]
    );
    
    if (dependencies[0].count > 0) {
      return res.status(409).json({ 
        error: "Cannot delete course with existing units. Remove associated units first." 
      });
    }

    const [result] = await db.execute(
      "DELETE FROM courses WHERE course_id = ?", 
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};