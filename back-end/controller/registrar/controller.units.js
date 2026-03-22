import db from "../../database/mysql_database.js";
import moment from "moment";

// CREATE UNIT
export const createUnit = async (req, res) => {
  try {
    const { unit_code, unit_name, course_id, module, course_code } = req.body;

    if (!unit_code || !unit_name || !course_id) {
      return res.status(400).json({ message: "unit_code, unit_name, and course_id are required" });
    }

    // Check duplicate in same course
    const [existing] = await db.execute(
      "SELECT unit_id FROM units WHERE unit_code = ? AND course_id = ?",
      [unit_code, course_id]
    );
    if (existing.length > 0) return res.status(409).json({ message: "Unit with this code already exists for this course" });

    // Fetch course_code if not provided
    let finalCourseCode = course_code;
    if (!finalCourseCode) {
      const [courseRows] = await db.execute("SELECT course_code FROM courses WHERE course_id = ?", [course_id]);
      if (courseRows.length === 0) return res.status(404).json({ message: "Course not found" });
      finalCourseCode = courseRows[0].course_code;
    }

    const [result] = await db.execute(
      `INSERT INTO units (unit_code, unit_name, course_id, module, course_code, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [unit_code, unit_name, course_id, module || null, finalCourseCode, moment().format("YYYY-MM-DD HH:mm:ss")]
    );

    res.status(201).json({
      unit_id: result.insertId,
      unit_code,
      unit_name,
      course_id,
      module: module || null,
      course_code: finalCourseCode,
    });
  } catch (err) {
    console.error("Create Unit Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE UNIT
export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit_code, unit_name, module } = req.body;

    if (!unit_code || !unit_name) return res.status(400).json({ message: "unit_code and unit_name are required" });

    const [currentRows] = await db.execute("SELECT course_id FROM units WHERE unit_id = ?", [id]);
    if (currentRows.length === 0) return res.status(404).json({ message: "Unit not found" });

    const course_id = currentRows[0].course_id;

    const [checkRows] = await db.execute(
      "SELECT unit_id FROM units WHERE unit_code = ? AND course_id = ? AND unit_id != ?",
      [unit_code, course_id, id]
    );
    if (checkRows.length > 0) return res.status(409).json({ message: "Another unit with this code exists for this course" });

    await db.execute(
      "UPDATE units SET unit_code = ?, unit_name = ?, module = ? WHERE unit_id = ?",
      [unit_code, unit_name, module || null, id]
    );

    const [updatedRows] = await db.execute("SELECT * FROM units WHERE unit_id = ?", [id]);
    res.json(updatedRows[0]);
  } catch (err) {
    console.error("Update Unit Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET UNITS BY COURSE
export const getUnitsByCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM units WHERE course_id = ? ORDER BY unit_code", [courseId]);
    res.json(rows || []);
  } catch (err) {
    console.error("Get Units By Course Error:", err);
    res.status(500).json({ message: "Server error", units: [] });
  }
};

// GET UNIT BY ID
export const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute("SELECT * FROM units WHERE unit_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Unit not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Get Unit By ID Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET ALL UNITS
export const getAllUnits = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM units ORDER BY course_code, unit_code");
    res.json(rows || []);
  } catch (err) {
    console.error("Get All Units Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET UNITS WITH COURSE NAME
export const getUnitsWithCourseName = async (req, res) => {
  try {
    const sql = `
      SELECT u.unit_id, u.unit_code, u.unit_name, u.module, u.course_id, c.course_name
      FROM units u
      JOIN courses c ON u.course_id = c.course_id
      ORDER BY c.course_name, u.unit_code
    `;
    const [results] = await db.execute(sql);
    res.status(200).json({ units: results });
  } catch (err) {
    console.error("Get Units With Course Name Error:", err);
    res.status(500).json({ message: "Failed to fetch units with course name", error: err.message });
  }
};

// DELETE UNIT
export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute("DELETE FROM units WHERE unit_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Unit not found" });
    res.json({ message: "Unit deleted successfully" });
  } catch (err) {
    console.error("Delete Unit Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};