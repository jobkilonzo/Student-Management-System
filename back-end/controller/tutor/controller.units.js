import db from "../../database/mysql_database.js";


export const getAssignedUnits = async (req, res) => {
  const tutorId = req.user?.id; // assuming tutor ID comes from auth middleware

  try {
    const [units] = await db.query(
      `SELECT u.unit_id, u.unit_code, u.unit_name, c.course_name, ua.module
       FROM units u
       JOIN courses c ON u.course_id = c.course_id
       JOIN unit_assignments ua ON u.unit_id = ua.unit_id
       WHERE ua.tutor_id = ?`,
      [tutorId]
    );

    return res.status(200).json({ units });
  } catch (error) {
    console.error('Error fetching assigned units:', error);
    return res.status(500).json({ error: 'Failed to fetch assigned units' });
  }
};


/**
 * Get students for a particular unit
 */
export const getUnitStudents = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    const { unitId } = req.params;

    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });

    // Get the unit assignment for this tutor to validate access
    const [assignment] = await db.execute(
      `SELECT * FROM unit_assignments WHERE tutor_id = ? AND unit_id = ?`,
      [tutorId, unitId]
    );

    if (assignment.length === 0) {
      return res.status(403).json({ error: "You are not assigned to this unit" });
    }

    const { course_id, module } = assignment[0];

    // Fetch students doing this particular unit (course + module)
    const [students] = await db.execute(
      `SELECT id, reg_no, first_name, middle_name, last_name
       FROM students
       WHERE course_id = ? AND module = ?`,
      [course_id, module]
    );

    res.json({ students });
  } catch (err) {
    console.error("Error fetching unit students:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};