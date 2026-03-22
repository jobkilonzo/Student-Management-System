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