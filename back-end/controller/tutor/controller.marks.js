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
    res.json({ units: results }); // 'units' matches your React front-end
  } catch (err) {
    console.error("Error fetching assigned units:", err);
    res.status(500).json({ error: "Failed to fetch assigned units" });
  }
};

/** Get students + existing marks */
export const getStudentsForMarks = async (req, res) => {
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

  try {
    const [results] = await db.query(query, [unitId, tutorId]);
    res.json({ students: results });
  } catch (err) {
    console.error("Error fetching students for marks:", err);
    res.status(500).json({ error: "Database query failed" });
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

/** Save marks (bulk or single) */
export const saveMarks = async (req, res) => {
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

  try {
    await db.query(query, [values]);
    res.json({ message: "Marks saved successfully" });
  } catch (err) {
    console.error("Error saving marks:", err);
    res.status(500).json({ error: "Save failed" });
  }
};

/** Delete a student's mark */
export const deleteMark = async (req, res) => {
  const { unitId, studentId } = req.body;

  if (!unitId || !studentId) {
    return res.status(400).json({ error: "Missing data" });
  }

  const query = "DELETE FROM marks WHERE unit_id = ? AND student_id = ?";

  try {
    await db.query(query, [unitId, studentId]);
    res.json({ message: "Mark deleted successfully" });
  } catch (err) {
    console.error("Error deleting mark:", err);
    res.status(500).json({ error: "Delete failed" });
  }
};