import db from "../../database/mysql_database.js";
import XLSX from "xlsx";
import { Parser } from "json2csv";
import { getIO } from "../../services/realtime.js";

const makeHttpError = (status, body) => {
  const err = new Error(body?.error || "Request failed");
  err.status = status;
  err.body = body;
  return err;
};

const enforceAllowedPeriodIfNeeded = async ({ actorRole, actorId, unitId }) => {
  if (!actorRole || actorRole === "tutor") return;

  const [assignment] = await db.query(
    "SELECT course_id, module FROM unit_assignments WHERE tutor_id = ? AND unit_id = ? LIMIT 1",
    [actorId, Number(unitId)]
  );
  if (!assignment.length) {
    throw makeHttpError(403, { error: "Not assigned to this unit" });
  }

  const { course_id, module } = assignment[0];
  const [schedules] = await db.query(
    `SELECT marks_allowed_from, marks_allowed_to
     FROM exam_schedules
     WHERE unit_id = ? AND course_id = ? AND (? IS NULL OR module = ?)
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [Number(unitId), Number(course_id), module ?? null, module ?? null]
  );

  if (!schedules.length) return;

  const now = new Date();
  const from = schedules[0].marks_allowed_from ? new Date(schedules[0].marks_allowed_from) : null;
  const to = schedules[0].marks_allowed_to ? new Date(schedules[0].marks_allowed_to) : null;

  if (from && now < from) {
    throw makeHttpError(403, {
      error: "Marks entry is not allowed yet",
      code: "MARKS_NOT_ALLOWED_YET",
      marks_allowed_from: schedules[0].marks_allowed_from,
    });
  }
  if (to && now > to) {
    throw makeHttpError(403, {
      error: "Marks entry period has ended",
      code: "MARKS_PERIOD_ENDED",
      marks_allowed_to: schedules[0].marks_allowed_to,
    });
  }
};

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

const isAdminOrRegistrar = (role) => ["admin", "registrar"].includes(role);

const getPassMarksForUnit = async ({ unitId, courseId, module }) => {
  try {
    const [schedules] = await db.query(
      `SELECT pass_marks
       FROM exam_schedules
       WHERE unit_id = ? AND course_id = ? AND (? IS NULL OR module = ?)
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1`,
      [Number(unitId), Number(courseId), module ?? null, module ?? null]
    );

    if (schedules.length && schedules[0].pass_marks != null) return Number(schedules[0].pass_marks);
  } catch (err) {
    // exam_schedules may not exist yet in older DBs; ignore gracefully
    if (err?.code !== "ER_NO_SUCH_TABLE") throw err;
  }
  return 40;
};

const ensureCanAccessUnit = async ({ role, actorId, unitId }) => {
  if (isAdminOrRegistrar(role)) return { courseId: null, module: null };

  const [assignment] = await db.query(
    "SELECT course_id, module FROM unit_assignments WHERE tutor_id = ? AND unit_id = ? LIMIT 1",
    [actorId, Number(unitId)]
  );
  if (!assignment.length) {
    throw makeHttpError(403, { error: "Not assigned to this unit" });
  }
  return { courseId: Number(assignment[0].course_id), module: assignment[0].module ?? null };
};

const ensureCanAccessCourse = async ({ role, actorId, courseId }) => {
  if (isAdminOrRegistrar(role)) return;
  const [assignments] = await db.query(
    "SELECT id FROM unit_assignments WHERE tutor_id = ? AND course_id = ? LIMIT 1",
    [actorId, Number(courseId)]
  );
  if (!assignments.length) throw makeHttpError(403, { error: "Not assigned to this course" });
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
    await enforceAllowedPeriodIfNeeded({
      actorRole: req.user?.role,
      actorId: req.user?.id,
      unitId,
    });

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
    if (err?.status) return res.status(err.status).json(err.body);
    console.error("Error saving marks:", err);
    res.status(500).json({ error: "Save failed" });
  }
};

/** Marks summary by unit (class/course/student view helper) */
export const getUnitMarksSummary = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const role = req.user?.role;
    const { unitId } = req.params;

    if (!actorId || !role) return res.status(401).json({ error: "Unauthorized" });

    let courseId = null;
    let module = null;

    if (isAdminOrRegistrar(role)) {
      const [[unit]] = await db.query(
        "SELECT unit_id, course_id FROM units WHERE unit_id = ? LIMIT 1",
        [Number(unitId)]
      );
      if (!unit) return res.status(404).json({ error: "Unit not found" });
      courseId = Number(unit.course_id);
    } else {
      const access = await ensureCanAccessUnit({ role, actorId, unitId });
      courseId = access.courseId;
      module = access.module;
    }

    const passMarks = await getPassMarksForUnit({ unitId, courseId, module });

    const [[stats]] = await db.query(
      `SELECT
         COUNT(*) AS total_students,
         SUM(CASE WHEN m.id IS NULL THEN 0 ELSE 1 END) AS with_marks,
         AVG(m.total) AS avg_total,
         MIN(m.total) AS min_total,
         MAX(m.total) AS max_total,
         SUM(CASE WHEN m.total >= ? THEN 1 ELSE 0 END) AS pass_count
       FROM students s
       LEFT JOIN marks m
         ON m.student_id = s.id AND m.unit_id = ? AND m.term = s.term
       WHERE s.course_id = ? AND s.deleted_at IS NULL`,
      [passMarks, Number(unitId), courseId]
    );

    const [gradeRows] = await db.query(
      `SELECT
         CASE
           WHEN m.id IS NULL THEN 'NOT_ENTERED'
           ELSE COALESCE(m.grade, '-')
         END AS grade,
         COUNT(*) AS count
       FROM students s
       LEFT JOIN marks m
         ON m.student_id = s.id AND m.unit_id = ? AND m.term = s.term
       WHERE s.course_id = ? AND s.deleted_at IS NULL
       GROUP BY grade
       ORDER BY count DESC`,
      [Number(unitId), courseId]
    );

    const [students] = await db.query(
      `SELECT
         s.id,
         s.reg_no,
         CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name) AS name,
         COALESCE(m.cat_mark, NULL) AS cat_mark,
         COALESCE(m.exam_mark, NULL) AS exam_mark,
         COALESCE(m.total, NULL) AS total,
         COALESCE(m.grade, NULL) AS grade,
         COALESCE(m.attendance, NULL) AS attendance
       FROM students s
       LEFT JOIN marks m
         ON m.student_id = s.id AND m.unit_id = ? AND m.term = s.term
       WHERE s.course_id = ? AND s.deleted_at IS NULL
       ORDER BY s.reg_no`,
      [Number(unitId), courseId]
    );

    return res.json({
      success: true,
      unit_id: Number(unitId),
      course_id: courseId,
      pass_marks: passMarks,
      stats: {
        total_students: Number(stats?.total_students || 0),
        with_marks: Number(stats?.with_marks || 0),
        pass_count: Number(stats?.pass_count || 0),
        avg_total: stats?.avg_total != null ? Number(stats.avg_total) : null,
        min_total: stats?.min_total != null ? Number(stats.min_total) : null,
        max_total: stats?.max_total != null ? Number(stats.max_total) : null,
      },
      grades: gradeRows.map((g) => ({ grade: g.grade, count: Number(g.count) })),
      students,
    });
  } catch (err) {
    if (err?.status) return res.status(err.status).json(err.body);
    console.error("Get Unit Marks Summary Error:", err);
    return res.status(500).json({ error: "Failed to load unit marks summary" });
  }
};

/** Marks summary by course (class-level view) */
export const getCourseMarksSummary = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const role = req.user?.role;
    const { courseId } = req.params;

    if (!actorId || !role) return res.status(401).json({ error: "Unauthorized" });

    await ensureCanAccessCourse({ role, actorId, courseId });

    const [units] = await db.query(
      isAdminOrRegistrar(role)
        ? "SELECT unit_id, unit_code, unit_name FROM units WHERE course_id = ? ORDER BY unit_code"
        : `SELECT u.unit_id, u.unit_code, u.unit_name
           FROM unit_assignments ua
           JOIN units u ON u.unit_id = ua.unit_id
           WHERE ua.tutor_id = ? AND ua.course_id = ?
           ORDER BY u.unit_code`,
      isAdminOrRegistrar(role) ? [Number(courseId)] : [actorId, Number(courseId)]
    );

    if (!units.length) {
      return res.json({ success: true, course_id: Number(courseId), units: [] });
    }

    const summaries = [];

    for (const u of units) {
      // eslint-disable-next-line no-await-in-loop
      const [[stats]] = await db.query(
        `SELECT
           COUNT(*) AS total_students,
           SUM(CASE WHEN m.id IS NULL THEN 0 ELSE 1 END) AS with_marks,
           AVG(m.total) AS avg_total,
           MIN(m.total) AS min_total,
           MAX(m.total) AS max_total
         FROM students s
         LEFT JOIN marks m
           ON m.student_id = s.id AND m.unit_id = ? AND m.term = s.term
         WHERE s.course_id = ? AND s.deleted_at IS NULL`,
        [Number(u.unit_id), Number(courseId)]
      );

      summaries.push({
        unit_id: Number(u.unit_id),
        unit_code: u.unit_code,
        unit_name: u.unit_name,
        total_students: Number(stats?.total_students || 0),
        with_marks: Number(stats?.with_marks || 0),
        avg_total: stats?.avg_total != null ? Number(stats.avg_total) : null,
        min_total: stats?.min_total != null ? Number(stats.min_total) : null,
        max_total: stats?.max_total != null ? Number(stats.max_total) : null,
      });
    }

    return res.json({ success: true, course_id: Number(courseId), units: summaries });
  } catch (err) {
    if (err?.status) return res.status(err.status).json(err.body);
    console.error("Get Course Marks Summary Error:", err);
    return res.status(500).json({ error: "Failed to load course marks summary" });
  }
};

/** Marks summary by student */
export const getStudentMarksSummary = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const role = req.user?.role;
    const { studentId } = req.params;

    if (!actorId || !role) return res.status(401).json({ error: "Unauthorized" });

    const [[student]] = await db.query(
      "SELECT id, reg_no, course_id, term, deleted_at FROM students WHERE id = ? LIMIT 1",
      [Number(studentId)]
    );
    if (!student || student.deleted_at) return res.status(404).json({ error: "Student not found" });

    const courseId = Number(student.course_id);

    // Admin/Registrar can view any student; others only for courses/units they are assigned
    if (!isAdminOrRegistrar(role)) {
      await ensureCanAccessCourse({ role, actorId, courseId });
    }

    const [unitRows] = await db.query(
      isAdminOrRegistrar(role)
        ? "SELECT unit_id, unit_code, unit_name FROM units WHERE course_id = ? ORDER BY unit_code"
        : `SELECT u.unit_id, u.unit_code, u.unit_name
           FROM unit_assignments ua
           JOIN units u ON u.unit_id = ua.unit_id
           WHERE ua.tutor_id = ? AND ua.course_id = ?
           ORDER BY u.unit_code`,
      isAdminOrRegistrar(role) ? [courseId] : [actorId, courseId]
    );

    if (!unitRows.length) {
      return res.json({
        success: true,
        student: {
          id: Number(student.id),
          reg_no: student.reg_no,
          course_id: courseId,
          term: student.term,
        },
        marks: [],
        stats: { avg_total: null, min_total: null, max_total: null },
      });
    }

    const unitIds = unitRows.map((u) => Number(u.unit_id));
    const placeholders = unitIds.map(() => "?").join(",");

    const [marks] = await db.query(
      `SELECT
         u.unit_id,
         u.unit_code,
         u.unit_name,
         m.cat_mark,
         m.exam_mark,
         m.total,
         m.grade,
         m.attendance,
         m.term
       FROM units u
       LEFT JOIN marks m
         ON m.unit_id = u.unit_id AND m.student_id = ? AND m.term = ?
       WHERE u.unit_id IN (${placeholders})
       ORDER BY u.unit_code`,
      [Number(studentId), Number(student.term), ...unitIds]
    );

    const totals = marks.map((m) => (m.total == null ? null : Number(m.total))).filter((t) => t != null);
    const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null;
    const min = totals.length ? Math.min(...totals) : null;
    const max = totals.length ? Math.max(...totals) : null;

    return res.json({
      success: true,
      student: {
        id: Number(student.id),
        reg_no: student.reg_no,
        course_id: courseId,
        term: student.term,
      },
      marks,
      stats: {
        avg_total: avg != null ? Number(avg.toFixed(2)) : null,
        min_total: min,
        max_total: max,
      },
    });
  } catch (err) {
    if (err?.status) return res.status(err.status).json(err.body);
    console.error("Get Student Marks Summary Error:", err);
    return res.status(500).json({ error: "Failed to load student marks summary" });
  }
};

/** Reset a student's marks for a specific term */
export const resetMark = async (req, res) => {
  const { unitId, studentId, term } = req.body;

  if (!unitId || !studentId || !term) return res.status(400).json({ error: "Missing data" });
  if (![1, 2, 3].includes(term)) return res.status(400).json({ error: "Invalid term" });

  try {
    await enforceAllowedPeriodIfNeeded({
      actorRole: req.user?.role,
      actorId: req.user?.id,
      unitId,
    });

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
    if (err?.status) return res.status(err.status).json(err.body);
    console.error("Error resetting mark:", err);
    res.status(500).json({ error: "Reset failed" });
  }
};

/** Bulk upload marks via Excel/CSV (Registrar/Exam Officer) */
export const uploadMarksFile = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const role = req.user?.role;

    if (!["registrar", "exam_officer"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!req.file?.path) {
      return res.status(400).json({ error: "File is required" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ error: "No data found in file" });
    }

    // Expected columns: unit_id, student_id (or reg_no), cat_mark, exam_mark, attendance(optional)
    const normalized = rows.map((r) => ({
      unit_id: Number(r.unit_id || r.unitId || r.UnitID || r.unit || ""),
      student_id: Number(r.student_id || r.studentId || r.StudentID || ""),
      reg_no: String(r.reg_no || r.regNo || r.RegNo || r.regno || "").trim(),
      cat_mark: Number(r.cat_mark ?? r.cat ?? r.CAT ?? r.catMarks ?? 0),
      exam_mark: Number(r.exam_mark ?? r.exam ?? r.EXAM ?? r.examMarks ?? 0),
      attendance: Number(r.attendance ?? r.Attendance ?? 0),
    }));

    const errors = [];
    const payloadByUnit = new Map();

    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i];
      const rowNum = i + 2; // header is row 1

      if (!row.unit_id) {
        errors.push({ row: rowNum, error: "unit_id is required" });
        continue;
      }

      let studentId = row.student_id;
      if (!studentId && row.reg_no) {
        const [[student]] = await db.query(
          "SELECT id FROM students WHERE reg_no = ? AND deleted_at IS NULL LIMIT 1",
          [row.reg_no]
        );
        studentId = student?.id || 0;
      }

      if (!studentId) {
        errors.push({ row: rowNum, error: "student_id or reg_no is required/valid" });
        continue;
      }

      if (Number.isNaN(row.cat_mark) || row.cat_mark < 0 || row.cat_mark > 30) {
        errors.push({ row: rowNum, error: "cat_mark must be 0-30" });
        continue;
      }
      if (Number.isNaN(row.exam_mark) || row.exam_mark < 0 || row.exam_mark > 70) {
        errors.push({ row: rowNum, error: "exam_mark must be 0-70" });
        continue;
      }
      if (Number.isNaN(row.attendance) || row.attendance < 0 || row.attendance > 100) {
        errors.push({ row: rowNum, error: "attendance must be 0-100" });
        continue;
      }

      if (!payloadByUnit.has(row.unit_id)) payloadByUnit.set(row.unit_id, []);
      payloadByUnit.get(row.unit_id).push({
        student_id: studentId,
        cat_mark: row.cat_mark,
        exam_mark: row.exam_mark,
        attendance: row.attendance,
      });
    }

    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", errors });
    }

    for (const [unitId, marks] of payloadByUnit.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await enforceAllowedPeriodIfNeeded({ actorRole: role, actorId, unitId });

      const values = [];
      for (const m of marks) {
        // eslint-disable-next-line no-await-in-loop
        const [[student]] = await db.query(
          `SELECT id, term, module FROM students WHERE id=? AND deleted_at IS NULL`,
          [m.student_id]
        );
        if (!student) continue;

        const cat = Number(m.cat_mark) || 0;
        const exam = Number(m.exam_mark) || 0;
        const total = cat + exam;
        const attendance = Number(m.attendance) || 0;
        const grade = getGrade(total);

        values.push([
          student.id,
          unitId,
          student.term,
          cat,
          exam,
          total,
          grade,
          0,
          student.module,
          attendance,
        ]);
      }

      if (!values.length) {
        throw makeHttpError(400, { error: `No valid students to save marks for unit ${unitId}` });
      }

      // eslint-disable-next-line no-await-in-loop
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
    }

    await db.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "BULK_UPLOAD_MARKS", null, `Bulk uploaded marks (${normalized.length} rows)`]
    );

    return res.json({ success: true, message: "Marks uploaded successfully" });
  } catch (err) {
    if (err?.status) return res.status(err.status).json(err.body);
    console.error("Upload Marks File Error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};

/** Export marks to CSV (assigned unit only) */
export const exportMarksCsv = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const { unitId } = req.params;

    const [assignment] = await db.query(
      "SELECT course_id FROM unit_assignments WHERE tutor_id = ? AND unit_id = ? LIMIT 1",
      [actorId, Number(unitId)]
    );
    if (!assignment.length) return res.status(403).json({ error: "Not assigned to this unit" });

    const courseId = Number(assignment[0].course_id);
    const [rows] = await db.query(
      `SELECT 
         s.reg_no,
         CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name) AS name,
         s.term,
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
      [Number(unitId), courseId]
    );

    const parser = new Parser({
      fields: ["reg_no", "name", "term", "cat_mark", "exam_mark", "total", "grade", "attendance"],
    });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`marks_unit_${unitId}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("Export Marks CSV Error:", err);
    res.status(500).json({ error: "Export failed" });
  }
};

/** Release marks (notify students in-app) */
export const releaseMarks = async (req, res) => {
  try {
    const role = req.user?.role;
    const actorId = req.user?.id;
    const { unitId } = req.body || {};

    if (!["registrar", "exam_officer"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!unitId) return res.status(400).json({ error: "unitId is required" });

    const [unitRows] = await db.query(
      "SELECT unit_name, unit_code FROM units WHERE unit_id = ? LIMIT 1",
      [Number(unitId)]
    );
    const unitName = unitRows?.[0]?.unit_name || `Unit ${unitId}`;

    const title = "Marks Released";
    const message = `Marks have been released for ${unitName}.`;

    const [result] = await db.execute(
      "INSERT INTO notifications (title, message, role, is_read, created_at) VALUES (?, ?, 'student', 0, NOW())",
      [title, message]
    );

    const io = getIO();
    if (io) {
      io.emit("new-notification", {
        id: result.insertId,
        title,
        message,
        role: "student",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    await db.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "RELEASE_MARKS", null, `Released marks for unit ${unitId}`]
    );

    return res.json({ success: true, message: "Marks released and students notified" });
  } catch (err) {
    console.error("Release Marks Error:", err);
    return res.status(500).json({ error: "Release failed" });
  }
};
