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

  // Check if unit with same code already exists for this course
  const checkQuery = "SELECT unit_id FROM units WHERE unit_code = ? AND course_id = ?";
  db.query(checkQuery, [code, course_id], (err, unitRows) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (unitRows.length > 0) {
      return res.status(409).json({ message: "Unit with this code already exists for this course" });
    }

    // 1️⃣ Get course code
    db.query("SELECT course_code FROM courses WHERE course_id = ?", [course_id], (err, courseRows) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (courseRows.length === 0) {
        return res.status(404).json({ message: "Course not found" });
      }

      const course_code = courseRows[0].code;

      // 2️⃣ Insert unit
      const insertQuery = `INSERT INTO units (unit_code, unit_name, course_id, course_code, createdAt)
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


  const qs = "SELECT * FROM units WHERE course_id = ? ORDER BY unit_code";

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
export const getUnitById = (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM units WHERE unit_id = ?";

  db.query(query, [id], (err, rows) => {
    if (err) {
      console.error("Get Unit Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json(rows[0]);
  });
};

/**
 * UPDATE UNIT
 * PUT /api/v1/registrar/units/:id
 */
export const updateUnit = (req, res) => {
  const { id } = req.params;
  const { code, name } = req.body;

  if (!code || !name) {
    return res.status(400).json({ message: "Code and name are required" });
  }

  // First, get the current unit to know its course_id
  const getCurrentQuery = "SELECT course_id FROM units WHERE unit_id = ?";
  db.query(getCurrentQuery, [id], (err, currentRows) => {
    if (err) {
      console.error("Get Current Unit Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const courseId = currentRows[0].course_id;

    // Check if another unit with same code exists for this course (excluding current unit)
    const checkQuery = "SELECT unit_id FROM units WHERE unit_code = ? AND course_id = ? AND unit_id != ?";
    db.query(checkQuery, [code, courseId, id], (err, checkRows) => {
      if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      if (checkRows.length > 0) {
        return res.status(409).json({ message: "Another unit with this code already exists for this course" });
      }

      // No conflict, proceed with update
      const updateQuery = "UPDATE units SET unit_code = ?, unit_name = ? WHERE unit_id = ?";

      db.query(updateQuery, [code, name, id], (err, result) => {
        if (err) {
          console.error("Update Unit Error:", err);
          return res.status(500).json({ message: "Server error" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Unit not found" });
        }

        // Fetch the updated unit
        const selectQuery = "SELECT * FROM units WHERE unit_id = ?";
        db.query(selectQuery, [id], (err, rows) => {
          if (err) {
            console.error("Fetch Updated Unit Error:", err);
            return res.status(500).json({ message: "Server error" });
          }

          res.json(rows[0]);
        });
      });
    });
  });
};

/**
 * GET ALL UNITS
 * GET /api/v1/registrar/units
 */
export const getAllUnits = (req, res) => {
  const query = "SELECT * FROM units ORDER BY course_code, unit_code";

  db.query(query, (err, rows) => {
    if (err) {
      console.error("Fetch All Units Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json(rows || []);
  });
};

/**
 * DELETE UNIT
 * DELETE /api/v1/registrar/units/:id
 */
export const deleteUnit = (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM units WHERE unit_id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Delete Unit Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json({ message: "Unit deleted successfully" });
  });
};