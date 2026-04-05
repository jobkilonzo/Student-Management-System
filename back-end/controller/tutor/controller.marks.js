import db from "../../database/mysql_database.js";

/** Get tutor assigned units */
export const getTutorClasses = async (req, res) => {
  const tutorId = req.user.id;

  const query = `
    SELECT ua.unit_id, u.unit_name AS name, c.course_name AS course, ua.module AS term
    FROM unit_assignments ua
    JOIN units u ON ua.unit_id = u.unit_id
    JOIN courses c ON ua.course_id = c.course_id
    WHERE ua.tutor_id = ?
  `;

  try {
    const [results] = await db.query(query, [tutorId]);
    res.json({ units: results });
  } catch (err) {
    console.error("Error fetching assigned units:", err);
    res.status(500).json({ error: "Failed to fetch assigned units" });
  }
};

/** Grade calculator */
const getGrade = (total) => {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
};

/** Get students + marks for a specific term */
export const getStudentsForMarks = async (req, res) => {
  const tutorId = req.user.id;
  const unitId = Number(req.params.unitId);

  try {
    // 1. Get tutor assignment for this unit
    const [unitAssignRows] = await db.query(
      `SELECT course_id FROM unit_assignments WHERE tutor_id=? AND unit_id=?`,
      [tutorId, unitId]
    );
    if (!unitAssignRows.length)
      return res.status(404).json({ error: "Unit assignment not found" });

    const courseId = Number(unitAssignRows[0].course_id);

    // 2. Get students for this course (excluding soft-deleted)
    const [results] = await db.query(
      `SELECT 
         s.id,
         CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name) AS name,
         s.reg_no,
         s.course_id,
         s.term AS student_term,
         COALESCE(m.cat_mark, 0) AS cat_mark,
         COALESCE(m.exam_mark, 0) AS exam_mark,
         COALESCE(m.total, 0) AS total,
         COALESCE(m.grade, '-') AS grade,
         COALESCE(m.attendance, 0) AS attendance
       FROM students s
       LEFT JOIN marks m
         ON m.student_id = s.id AND m.unit_id = ? AND m.term = s.term
       WHERE s.course_id = ? AND s.deleted_at IS NULL
       ORDER BY s.reg_no`,
      [unitId, courseId]
    );

    res.json({ students: results });
  } catch (err) {
    console.error("Error fetching students for marks:", err);
    res.status(500).json({ error: "Database query failed" });
  }
};
export const saveMarks = async (req, res) => {
  const { unitId, marks } = req.body;

  if (!unitId || !marks?.length) 
    return res.status(400).json({ error: "Missing data" });

  try {
    const values = [];

    for (const m of marks) {
      // Fetch student module and term
      const [[student]] = await db.query(
        `SELECT id, term, module FROM students WHERE id=? AND deleted_at IS NULL`,
        [m.student_id]
      );

      if (!student) continue; // skip invalid student

      const cat = Number(m.cat_mark) || 0;
      const exam = Number(m.exam_mark) || 0;
      const total = cat + exam;
      const attendance = Number(m.attendance) || 0;
      const grade = getGrade(total); // attendance ignored here

      values.push([
        student.id,       // student_id
        unitId,           // unit_id
        student.term,     // term
        cat,              // cat_mark
        exam,             // exam_mark
        total,            // total
        grade,            // grade
        0,                // is_locked default
        student.module,   // module
        attendance        // attendance
      ]);
    }

    if (!values.length)
      return res.status(400).json({ error: "No valid students to save marks" });

    await db.query(
      `INSERT INTO marks 
      (student_id, unit_id, term, cat_mark, exam_mark, total, grade, is_locked, module, attendance)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         cat_mark = VALUES(cat_mark),
         exam_mark = VALUES(exam_mark),
         total = VALUES(total),
         grade = VALUES(grade),
         module = VALUES(module),
         attendance = VALUES(attendance)`,
      [values]
    );

    res.json({ message: "Marks and attendance saved successfully" });

  } catch (err) {
    console.error("Error saving marks:", err);
    res.status(500).json({ error: "Save failed" });
  }
};

/** Reset a student's marks for a specific term */
export const resetMark = async (req, res) => {
  const { unitId, studentId, term } = req.body;

  if (!unitId || !studentId || !term) return res.status(400).json({ error: "Missing data" });
  if (![1, 2, 3].includes(term)) return res.status(400).json({ error: "Invalid term" });

  try {
    const [[student]] = await db.query(
      `SELECT id FROM students WHERE id=? AND deleted_at IS NULL`,
      [studentId]
    );
    if (!student) return res.status(404).json({ error: "Student not found or deleted" });

    const [result] = await db.query(
      `UPDATE marks
       SET cat_mark = 0, exam_mark = 0, total = 0, grade = '-'
       WHERE student_id = ? AND unit_id = ? AND term = ?`,
      [studentId, unitId, term]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Mark not found" });

    res.json({ message: "Mark reset successfully" });

  } catch (err) {
    console.error("Error resetting mark:", err);
    res.status(500).json({ error: "Reset failed" });
  }
};