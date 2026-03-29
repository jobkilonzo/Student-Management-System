import db from "../../database/mysql_database.js";
import moment from "moment";

/** Assign Unit */
export const assignUnit = async (req, res) => {
  try {
    let { tutorId, unitId, courseId, module } = req.body;

    tutorId = Number(tutorId);
    unitId = Number(unitId);
    courseId = Number(courseId);
    module = module || "Module 1";

    if (!tutorId || !unitId || !courseId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const insertQuery = `
      INSERT INTO unit_assignments (tutor_id, unit_id, course_id, module)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(insertQuery, [tutorId, unitId, courseId, module]);

    res.status(201).json({
      message: "Unit assigned successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: err.message });
  }
};

/** Get All Assignments */
export const getAssignments = async (req, res) => {
  try {
    const query = `
      SELECT 
        ua.*,
        u.unit_name,
        c.course_name,
        users.first_name AS tutorName
      FROM unit_assignments ua
      JOIN units u ON ua.unit_id = u.unit_id
      JOIN courses c ON ua.course_id = c.course_id
      JOIN users ON ua.tutor_id = users.id
      ORDER BY ua.assigned_at DESC
    `;
    const [results] = await db.execute(query);
    res.json({ assignments: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

/** Get Assignments with Controls */
export const getAssignmentsWithControls = async (req, res) => {
  try {
    const query = `
      SELECT 
        ua.*,
        u.unit_name,
        c.course_name,
        users.first_name AS tutorName,
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
    const [results] = await db.execute(query);
    res.json({ assignments: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

/** Update Control Flags */
export const updateControl = async (req, res) => {
  try {
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

    await db.execute(query, [
      tutorId,
      unitId,
      can_enter_marks ? 1 : 0,
      can_edit_delete ? 1 : 0,
    ]);

    res.json({ message: "Control updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error (update failed)" });
  }
};

/** DELETE assignment */
export const unassignUnit = async (req, res) => {
  try {
    const { tutorId, unitId } = req.body;

    if (!tutorId || !unitId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
      DELETE FROM unit_assignments
      WHERE tutor_id = ? AND unit_id = ?
    `;

    await db.execute(query, [tutorId, unitId]);
    res.json({ message: "Unit unassigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unassign unit" });
  }
};

/** Check if User is Tutor */
export const checkIfUserIsTutor = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized, user info missing" });
    }

    const userId = req.user.id;
    const query = `SELECT COUNT(*) AS count FROM unit_assignments WHERE tutor_id = ?`;
    const [rows] = await db.execute(query, [userId]);

    res.json({ isTutor: rows[0].count > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error checking tutor assignments" });
  }
};