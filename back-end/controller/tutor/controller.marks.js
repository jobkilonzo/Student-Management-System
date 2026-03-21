import db from "../../database/mysql_database.js";

/** Get tutor assigned units */
export const getTutorClasses = (req, res) => {
  const tutorId = req.user.id;

  const query = `
    SELECT ua.unit_id, u.unit_name, c.course_name, ua.module
    FROM unit_assignments ua
    JOIN units u ON ua.unit_id = u.unit_id
    JOIN courses c ON ua.course_id = c.course_id
    WHERE ua.tutor_id = ?
  `;

  db.query(query, [tutorId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ classes: results });
  });
};

/** Get students + existing marks */
export const getStudentsForMarks = (req, res) => {
  const tutorId = req.user.id;
  const unitId = Number(req.params.unitId);

  const query = `
    SELECT 
      s.id,
      CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name) AS name,
      s.reg_no,
      COALESCE(m.cat_mark, 0) AS cat_mark,
      COALESCE(m.exam_mark, 0) AS exam_mark,
      COALESCE(m.total, 0) AS total,
      COALESCE(m.grade, '-') AS grade
    FROM students s
    JOIN unit_assignments ua 
      ON ua.unit_id = ? AND ua.tutor_id = ?
    JOIN units u 
      ON u.unit_id = ua.unit_id
    LEFT JOIN marks m 
      ON m.student_id = s.id AND m.unit_id = u.unit_id
    WHERE s.course_id = ua.course_id
    ORDER BY s.reg_no
  `;

  db.query(query, [unitId, tutorId], (err, results) => {
    if (err) {
      console.error("DB ERROR:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json({ students: results });
  });
};

/** Grade calculator */
const getGrade = (total) => {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
};

/** Save marks (Edit/Save) */
export const saveMarks = (req, res) => {
  const { unitId, marks } = req.body;

  if (!unitId || !marks?.length) {
    return res.status(400).json({ error: "Missing data" });
  }

  const values = marks.map((m) => {
    const cat = Number(m.cat_mark) || 0;
    const exam = Number(m.exam_mark) || 0;
    const total = cat + exam;
    const grade = getGrade(total);
    return [m.student_id, unitId, cat, exam, total, grade];
  });

  const query = `
    INSERT INTO marks (student_id, unit_id, cat_mark, exam_mark, total, grade)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      cat_mark = VALUES(cat_mark),
      exam_mark = VALUES(exam_mark),
      total = VALUES(total),
      grade = VALUES(grade)
  `;

  db.query(query, [values], (err) => {
    if (err) {
      console.error("Save failed:", err);
      return res.status(500).json({ error: "Save failed" });
    }
    res.json({ message: "Marks saved successfully" });
  });
};

/** Delete a student's mark */
export const deleteMark = (req, res) => {
  const { unitId, studentId } = req.body;

  if (!unitId || !studentId) {
    return res.status(400).json({ error: "Missing data" });
  }

  const query = "DELETE FROM marks WHERE unit_id = ? AND student_id = ?";
  db.query(query, [unitId, studentId], (err) => {
    if (err) {
      console.error("Delete failed:", err);
      return res.status(500).json({ error: "Delete failed" });
    }
    res.json({ message: "Mark deleted successfully" });
  });
};