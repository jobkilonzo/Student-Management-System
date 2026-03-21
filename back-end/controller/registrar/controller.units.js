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
  const { unit_code, unit_name } = req.body; // match request body

  if (!unit_code || !unit_name) {
    return res.status(400).json({ message: "Unit code and name are required" });
  }

  // Get the current unit to know its course_id
  const getCurrentQuery = "SELECT course_id FROM units WHERE unit_id = ?";
  db.query(getCurrentQuery, [id], (err, currentRows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (currentRows.length === 0) return res.status(404).json({ message: "Unit not found" });

    const courseId = currentRows[0].course_id;

    // Check for duplicate unit code in the same course
    const checkQuery = "SELECT unit_id FROM units WHERE unit_code = ? AND course_id = ? AND unit_id != ?";
    db.query(checkQuery, [unit_code, courseId, id], (err, checkRows) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (checkRows.length > 0)
        return res.status(409).json({ message: "Another unit with this code already exists for this course" });

      // Update the unit
      const updateQuery = "UPDATE units SET unit_code = ?, unit_name = ? WHERE unit_id = ?";
      db.query(updateQuery, [unit_code, unit_name, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Unit not found" });

        // Return updated unit
        db.query("SELECT * FROM units WHERE unit_id = ?", [id], (err, rows) => {
          if (err) return res.status(500).json({ message: "Server error" });
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

export const getUnitsWithCourseName = (req, res) => {
  const sql = `
    SELECT u.unit_id, u.unit_name, u.module, u.course_id, c.course_name
    FROM units u
    JOIN courses c ON u.course_id = c.course_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching units with course name:", err);
      return res.status(500).json({ error: "Failed to fetch units with course name" });
    }

    res.status(200).json({ units: results }); // results is the array of rows
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