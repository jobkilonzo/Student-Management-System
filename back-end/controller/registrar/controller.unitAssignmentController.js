import db from "../../database/mysql_database.js";
import moment from "moment";

/** Assign Unit */
export const assignUnit = (req, res) => {
  const { tutorId, unitId, courseId, module } = req.body;

  if (!tutorId || !unitId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const checkQuery = `
    SELECT * FROM unit_assignments 
    WHERE tutor_id = ? AND unit_id = ?
  `;

  db.query(checkQuery, [tutorId, unitId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error (check failed)" });
    if (results.length > 0) return res.status(400).json({ message: "Unit already assigned to this tutor" });

    const insertQuery = `
      INSERT INTO unit_assignments (tutor_id, unit_id, course_id, module)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertQuery, [tutorId, unitId, courseId, module], (err, result) => {
      if (err) return res.status(500).json({ error: "Database error (insert failed)" });

      res.status(201).json({ message: "Unit assigned successfully", id: result.insertId });
    });
  });
};

/** Get All Assignments */
export const getAssignments = (req, res) => {
  const query = `
    SELECT 
      ua.*,
      u.unit_name,
      c.course_name,
      users.name AS tutorName
    FROM unit_assignments ua
    JOIN units u ON ua.unit_id = u.unit_id
    JOIN courses c ON ua.course_id = c.course_id
    JOIN users ON ua.tutor_id = users.id
    ORDER BY ua.assigned_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ assignments: results });
  });
};

/** Get Assignments with Controls */
export const getAssignmentsWithControls = (req, res) => {
  const query = `
    SELECT 
      ua.*,
      u.unit_name,
      c.course_name,
      users.name AS tutorName,
      IFNULL(umc.can_enter_marks, 0) AS can_enter_marks,
      IFNULL(umc.can_edit_delete, 0) AS can_edit_delete
    FROM unit_assignments ua
    JOIN units u ON ua.unit_id = u.unit_id
    JOIN courses c ON ua.course_id = c.course_id
    JOIN users ON ua.tutor_id = users.id
    LEFT JOIN unit_mark_controls umc 
      ON umc.unit_id = ua.unit_id AND umc.tutor_id = ua.tutor_id
    ORDER BY ua.assigned_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ assignments: results });
  });
};

/** Update Control Flags */
export const updateControl = (req, res) => {
  const { tutorId, unitId, can_enter_marks, can_edit_delete } = req.body;

  if (!tutorId || !unitId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = `
    INSERT INTO unit_mark_controls (tutor_id, unit_id, can_enter_marks, can_edit_delete)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      can_enter_marks = VALUES(can_enter_marks),
      can_edit_delete = VALUES(can_edit_delete)
  `;

  db.query(query, [tutorId, unitId, can_enter_marks ? 1 : 0, can_edit_delete ? 1 : 0], (err) => {
    if (err) return res.status(500).json({ error: "Database error (update failed)" });
    res.json({ message: "Control updated successfully" });
  });
};