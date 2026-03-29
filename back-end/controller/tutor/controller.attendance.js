
import db from "../../database/mysql_database.js";
export const markUnitAttendance = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    const { unitId } = req.params;
    const { students } = req.body;

    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });
    if (!students || students.length === 0) {
      return res.status(400).json({ error: "No students selected for attendance" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Validate tutor assignment
    const [assignment] = await db.execute(
      `SELECT * FROM unit_assignments WHERE tutor_id = ? AND unit_id = ?`,
      [tutorId, unitId]
    );
    if (assignment.length === 0) return res.status(403).json({ error: "Not assigned to this unit" });

    // Insert attendance
    for (const student of students) {
  const { student_id, status } = student; // extract integer ID and status
  await db.execute(
    `INSERT INTO attendance (student_id, unit_id, tutor_id, date, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status=?`,
    [student_id, unitId, tutorId, today, status, status]
  );
}

    res.json({ message: "Attendance recorded successfully" });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * Get all classes/units assigned to the logged-in tutor
 */
export const getTodaysClasses = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });

    // Fetch all units assigned to this tutor
    const [classes] = await db.execute(
      `SELECT ua.id AS assignment_id, ua.unit_id, ua.module, ua.course_id,
              u.unit_name AS subject,
              u.course_code,
              ua.assigned_at
       FROM unit_assignments ua
       JOIN units u ON ua.unit_id = u.unit_id
       WHERE ua.tutor_id = ?`,
      [tutorId]
    );

    // Optional: filter by today's date if you have a schedule field
    // For now, return all assigned units
    res.json({ classes });
  } catch (err) {
    console.error("Error fetching today's classes:", err);
    res.status(500).json({ error: "Internal server error" });
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

    // Get tutor assignment
    const [assignment] = await db.execute(
      `SELECT * FROM unit_assignments WHERE tutor_id = ? AND unit_id = ?`,
      [tutorId, unitId]
    );
    if (assignment.length === 0) {
      return res.status(403).json({ error: "You are not assigned to this unit" });
    }

    const { course_id } = assignment[0];
    const today = new Date().toISOString().split("T")[0];

    // Fetch students not yet marked for attendance today
    const [students] = await db.execute(
      `SELECT s.id, s.reg_no, s.first_name, s.middle_name, s.last_name
       FROM students s
       WHERE s.course_id = ? 
       AND s.id NOT IN (
         SELECT student_id 
         FROM attendance 
         WHERE unit_id = ? AND date = ?
       )
       ORDER BY s.reg_no`,
      [course_id, unitId, today]
    );

    res.json({ students });
  } catch (err) {
    console.error("Error fetching unit students:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};