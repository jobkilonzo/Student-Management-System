import db from "../../database/mysql_database.js";
import { Parser } from "json2csv"; // npm install json2csv

/** Mark attendance for a unit */
export const markUnitAttendance = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    const { unitId } = req.params;
    const { students } = req.body;

    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });
    if (!students || students.length === 0)
      return res.status(400).json({ error: "No students selected" });

    const today = new Date().toISOString().split("T")[0];

    // Check tutor assignment
    const [assignment] = await db.execute(
      `SELECT * FROM unit_assignments WHERE tutor_id = ? AND unit_id = ?`,
      [tutorId, unitId]
    );
    if (!assignment.length) return res.status(403).json({ error: "Not assigned to this unit" });

    // Insert/update attendance for each student
    for (const student of students) {
      const { student_id, status } = student;

      // Skip soft-deleted students
      const [[validStudent]] = await db.execute(
        `SELECT id FROM students WHERE id = ? AND deleted_at IS NULL`,
        [student_id]
      );
      if (!validStudent) continue;

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

/** Get all units/classes assigned to the logged-in tutor */
export const getTodaysClasses = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });

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

    res.json({ classes });
  } catch (err) {
    console.error("Error fetching today's classes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** Get students for a particular unit (exclude soft-deleted) */
export const getUnitStudents = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    const { unitId } = req.params;

    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });

    const [assignment] = await db.execute(
      `SELECT * FROM unit_assignments WHERE tutor_id = ? AND unit_id = ?`,
      [tutorId, unitId]
    );
    if (!assignment.length) return res.status(403).json({ error: "Not assigned to this unit" });

    const { course_id } = assignment[0];
    const today = new Date().toISOString().split("T")[0];

    // Fetch students not yet marked for today
    const [students] = await db.execute(
      `SELECT s.id, s.reg_no, s.first_name, s.middle_name, s.last_name
       FROM students s
       WHERE s.course_id = ? 
         AND s.deleted_at IS NULL
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

/** Get daily attendance for a unit */
export const getDailyAttendance = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    const { unitId, date } = req.params;
    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });

    const attendanceDate = date || new Date().toISOString().split("T")[0];

    const [assignment] = await db.execute(
      `SELECT * FROM unit_assignments WHERE tutor_id = ? AND unit_id = ?`,
      [tutorId, unitId]
    );
    if (!assignment.length) return res.status(403).json({ error: "Not assigned to this unit" });

    const [attendance] = await db.execute(
      `SELECT a.student_id, s.reg_no, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS name,
              a.status, a.date
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.unit_id = ? AND a.tutor_id = ? AND a.date = ? AND s.deleted_at IS NULL
       ORDER BY s.reg_no`,
      [unitId, tutorId, attendanceDate]
    );

    res.json({ date: attendanceDate, attendance });
  } catch (err) {
    console.error("Error fetching daily attendance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** Download  attendance as CSV */
export const downloadAllAttendance = async (req, res) => {
  try {
    const tutorId = req.user?.id;
    const { unitId } = req.params;

    if (!tutorId) return res.status(401).json({ error: "Unauthorized" });

    const [assignment] = await db.execute(
      `SELECT * FROM unit_assignments WHERE tutor_id = ? AND unit_id = ?`,
      [tutorId, unitId]
    );
    if (!assignment.length) return res.status(403).json({ error: "Not assigned to this unit" });

    const [attendance] = await db.execute(
      `SELECT s.reg_no, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS name,
              a.status, a.date
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.unit_id = ? AND a.tutor_id = ? AND s.deleted_at IS NULL
       ORDER BY a.date, s.reg_no`,
      [unitId, tutorId]
    );

    if (!attendance.length) return res.status(404).json({ error: "No attendance found" });

    const parser = new Parser({ fields: ["reg_no", "name", "status", "date"] });
    const csv = parser.parse(attendance);

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance_${unitId}_all_days.csv`);
    res.send(csv);
  } catch (err) {
    console.error("Error downloading all attendance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};