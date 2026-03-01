import db from "../../database/mysql_database.js"
import moment from "moment";

/**
 * CREATE UNIT
 * POST /api/v1/registrar/units
 */


export const createUnit = (req, res) => {
  const { code, name, course_id } = req.body;

  if (!code || !name || !course_id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 1️⃣ Get course code
  db.query("SELECT code FROM courses WHERE id = ?", [course_id], (err, courseRows) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (courseRows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const course_code = courseRows[0].code;

    // 2️⃣ Insert unit
    const insertQuery = `INSERT INTO units (code, name, course_id, course_code, createdAt)
                         VALUES (?, ?, ?, ?, ?)`;

    const values = [code, name, course_id, course_code, moment().format("YYYY-MM-DD HH:mm:ss")];

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("Insert Unit Error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      res.status(201).json({
        id: result.insertId,
        code,
        name,
        course_id,
        course_code,
      });
    });
  });
};

/**
 * GET UNITS BY COURSE
 * GET /api/v1/registrar/courses/:courseId/units
 */

// controller.units.js
export const getUnitsByCourse = (req, res) => {
  const courseId = Number(req.params.id);
  console.log("Fetching units for courseId:", courseId);


  const qs = "SELECT * FROM units WHERE course_id = ? ORDER BY code";

  db.query(qs, [courseId], (err, rows) => {
    if (err) {
      console.error("Fetch Units Error:", err);
      return res.status(500).json({ message: "Server error", units: [] });
    }

    // Always return an array
    return res.json(rows || []);
  });
};

/**
 * GET UNIT BY ID
 * GET /api/v1/registrar/units/:id
 */
export const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM units WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get Unit Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE UNIT
 * PUT /api/v1/registrar/units/:id
 */
export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;

    const [result] = await db.query(
      "UPDATE units SET code = ?, name = ? WHERE id = ?",
      [code, name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json({ message: "Unit updated successfully" });
  } catch (error) {
    console.error("Update Unit Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE UNIT
 * DELETE /api/v1/registrar/units/:id
 */
export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM units WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json({ message: "Unit deleted successfully" });
  } catch (error) {
    console.error("Delete Unit Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};