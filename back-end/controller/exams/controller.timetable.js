import db from "../../database/mysql_database.js";
import { normalizeTermInput } from "../../services/term.js";

/**
 * Generate exam timetable for a specific category (Technical or Business)
 * Assigns exam dates sequentially within the date range to courses
 */
export const generateTimetable = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id || null;
    const {
      date_start,
      date_end,
      exam_type,
      category,
      department,
      term,
      department_filter,
      semester, // backward-compatible alias (DB stays as-is)
      intake,
      course_id,
    } = normalizeTermInput(req.body || {});

    const departmentValue = department || category;

    // Validation
    if (!date_start || !date_end || !exam_type || !departmentValue) {
      connection.release();
      return res.status(400).json({
        error: "date_start, date_end, exam_type, and department are required",
      });
    }

    if (!["Normal", "Supplementary", "Retake"].includes(exam_type)) {
      connection.release();
      return res.status(400).json({
        error: 'exam_type must be "Normal", "Supplementary", or "Retake"',
      });
    }

    if (!["Technical", "Business"].includes(departmentValue)) {
      connection.release();
      return res.status(400).json({
        error: 'department must be "Technical" or "Business"',
      });
    }

    const startDate = new Date(date_start);
    const endDate = new Date(date_end);

    if (startDate > endDate) {
      connection.release();
      return res.status(400).json({
        error: "date_start must be before date_end",
      });
    }

    await connection.beginTransaction();

    // Step 1: Fetch courses by category (alias department)
    let courseQuery = `
      SELECT course_id, course_code, course_name, course_category
      FROM courses
      WHERE course_category = ?
    `;
    const courseParams = [departmentValue];

    if (course_id) {
      courseQuery += " AND course_id = ?";
      courseParams.push(course_id);
    }

    if (department_filter) {
      courseQuery += " AND course_category = ?";
      courseParams.push(department_filter);
    }

    courseQuery += " ORDER BY course_name, course_code";

    const [courses] = await connection.execute(courseQuery, courseParams);

    if (courses.length === 0) {
      await connection.rollback();
      connection.release();
      return res.json({
        success: true,
        warning: `No ${departmentValue} courses found for timetable generation`,
        timetable: null,
      });
    }

    if (course_id && courses.length > 0 && courses[0].course_id !== Number(course_id)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Selected course does not belong to the chosen department or could not be found." });
    }

    // Step 2: Check if timetable already exists for this configuration
    const [existingTimetables] = await connection.execute(
      `
      SELECT id FROM exam_timetables
      WHERE department = ? AND exam_type = ? AND date_start = ? AND date_end = ?
      LIMIT 1
      `,
      [departmentValue, exam_type, date_start, date_end]
    );

    let timetableId;

    if (existingTimetables.length > 0) {
      // Delete existing entries and reuse timetable
      timetableId = existingTimetables[0].id;
      await connection.execute(
        "DELETE FROM exam_timetable_entries WHERE timetable_id = ?",
        [timetableId]
      );
      await connection.execute(
        `
        UPDATE exam_timetables
        SET updated_at = NOW()
        WHERE id = ?
        `,
        [timetableId]
      );
    } else {
      // Create new timetable
      const [result] = await connection.execute(
        `
        INSERT INTO exam_timetables
          (department, exam_type, date_start, date_end, created_by)
        VALUES (?, ?, ?, ?, ?)
        `,
        [departmentValue, exam_type, date_start, date_end, actorId]
      );
      timetableId = result.insertId;
    }

    // Step 3: Generate exam schedule entries
    // Group courses by course_id and assign dates sequentially
    const entries = [];
    let currentDate = new Date(startDate);
    let courseIndex = 0;

    for (const course of courses) {
      // Fetch all units for this course
      const [units] = await connection.execute(
        `
        SELECT u.unit_id, u.unit_code, u.unit_name, u.course_id
        FROM units u
        WHERE u.course_id = ?
        ORDER BY u.unit_code
        `,
        [course.course_id]
      );

      // Assign each unit to a date in the range
      for (const unit of units) {
        // Ensure we don't exceed end date
        if (currentDate > endDate) {
          currentDate = new Date(startDate);
        }

        const examDate = new Date(currentDate);
        examDate.setHours(9, 0, 0, 0); // Default exam time: 9:00 AM

        const [result] = await connection.execute(
          `
          INSERT INTO exam_timetable_entries
            (timetable_id, unit_id, course_id, exam_date, exam_time, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
          `,
          [
            timetableId,
            unit.unit_id,
            unit.course_id,
            examDate.toISOString().split("T")[0],
            "09:00:00",
          ]
        );

        entries.push({
          id: result.insertId,
          timetable_id: timetableId,
          unit_id: unit.unit_id,
          unit_code: unit.unit_code,
          unit_name: unit.unit_name,
          course_id: unit.course_id,
          course_code: course.course_code,
          course_name: course.course_name,
          exam_date: examDate.toISOString().split("T")[0],
          exam_time: "09:00:00",
        });

        // Move to next day after every 3-4 units (configurable)
        courseIndex++;
        if (courseIndex % 3 === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Step 4: Log audit trail
    if (actorId) {
      await connection.execute(
        `
        INSERT INTO audit_logs (table_name, action, record_id, changed_by, created_at)
        VALUES (?, ?, ?, ?, NOW())
        `,
        [
          "exam_timetables",
          "CREATE",
          timetableId,
          actorId,
        ]
      ).catch(() => {}); // Ignore if audit_logs doesn't exist
    }

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      timetable: {
        id: timetableId,
        department: departmentValue,
        category: departmentValue,
        exam_type,
        date_start,
        date_end,
        term: term ?? null,
        intake: intake ?? null,
        entries_count: entries.length,
        entries,
      },
      message: `Timetable generated successfully for ${departmentValue} courses (${entries.length} units scheduled)`,
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Generate Timetable Error:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate timetable", details: err.message });
  }
};

/**
 * List all timetables with filters
 */
export const listTimetables = async (req, res) => {
  try {
    const { exam_type, status } = req.query || {};
    const department = req.category || req.query?.department || req.query?.category;

    const where = [];
    const params = [];

    if (department) {
      where.push("et.department = ?");
      params.push(department);
    }
    if (exam_type) {
      where.push("et.exam_type = ?");
      params.push(exam_type);
    }

    const [timetables] = await db.execute(
      `
      SELECT
        et.id,
        et.department,
        et.exam_type,
        et.date_start,
        et.date_end,
        COUNT(ete.id) as entries_count,
        et.created_by,
        et.created_at,
        et.updated_at,
        u.first_name as created_by_name
      FROM exam_timetables et
      LEFT JOIN exam_timetable_entries ete ON ete.timetable_id = et.id
      LEFT JOIN users u ON u.id = et.created_by
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY et.id, et.department, et.exam_type, et.date_start, et.date_end, et.created_by, et.created_at, et.updated_at, u.first_name
      ORDER BY et.created_at DESC
      `,
      params
    );

    return res.json({ success: true, timetables });
  } catch (err) {
    console.error("List Timetables Error:", err);
    return res.status(500).json({ error: "Failed to load timetables" });
  }
};

/**
 * Get timetable details with all entries
 */
export const getTimetableDetails = async (req, res) => {
  try {
    const timetableId = Number(req.params.id);

    if (!timetableId) {
      return res.status(400).json({ error: "Timetable ID is required" });
    }

    const [timetables] = await db.execute(
      `
      SELECT
        et.id,
        et.department,
        et.department AS category,
        et.exam_type,
        et.date_start,
        et.date_end,
        et.created_by,
        et.created_at,
        et.updated_at,
        u.first_name as created_by_name
      FROM exam_timetables et
      LEFT JOIN users u ON u.id = et.created_by
      WHERE et.id = ?
      LIMIT 1
      `,
      [timetableId]
    );

    if (timetables.length === 0) {
      return res.status(404).json({ error: "Timetable not found" });
    }

    const [entries] = await db.execute(
      `
      SELECT
        ete.id,
        ete.unit_id,
        ete.course_id,
        ete.exam_date,
        ete.exam_time,
        u.unit_code,
        u.unit_name,
        c.course_code,
        c.course_name
      FROM exam_timetable_entries ete
      LEFT JOIN units u ON u.unit_id = ete.unit_id
      LEFT JOIN courses c ON c.course_id = ete.course_id
      WHERE ete.timetable_id = ?
      ORDER BY ete.exam_date, ete.exam_time, u.unit_code
      `,
      [timetableId]
    );

    return res.json({
      success: true,
      timetable: {
        ...timetables[0],
        entries,
      },
    });
  } catch (err) {
    console.error("Get Timetable Details Error:", err);
    return res.status(500).json({ error: "Failed to load timetable details" });
  }
};

/**
 * Delete a timetable and all its entries
 */
export const deleteTimetable = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id || null;
    const timetableId = Number(req.params.id);

    if (!timetableId) {
      connection.release();
      return res.status(400).json({ error: "Timetable ID is required" });
    }

    await connection.beginTransaction();

    // Check if timetable exists
    const [timetables] = await connection.execute(
      "SELECT id FROM exam_timetables WHERE id = ? LIMIT 1 FOR UPDATE",
      [timetableId]
    );

    if (timetables.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Timetable not found" });
    }

    // Delete entries
    await connection.execute(
      "DELETE FROM exam_timetable_entries WHERE timetable_id = ?",
      [timetableId]
    );

    // Delete timetable
    await connection.execute("DELETE FROM exam_timetables WHERE id = ?", [
      timetableId,
    ]);

    // Log audit
    if (actorId) {
      await connection.execute(
        `
        INSERT INTO audit_logs (table_name, action, record_id, changed_by, created_at)
        VALUES (?, ?, ?, ?, NOW())
        `,
        ["exam_timetables", "DELETE", timetableId, actorId]
      ).catch(() => {});
    }

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Delete Timetable Error:", err);
    return res.status(500).json({ error: "Failed to delete timetable" });
  }
};

/**
 * Update exam schedule for individual unit in timetable
 */
export const updateTimetableEntry = async (req, res) => {
  try {
    const entryId = Number(req.params.id);
    const { exam_date, exam_time } = req.body || {};

    if (!entryId) {
      return res.status(400).json({ error: "Entry ID is required" });
    }

    if (!exam_date || !exam_time) {
      return res.status(400).json({
        error: "exam_date and exam_time are required",
      });
    }

    const [result] = await db.execute(
      `
      UPDATE exam_timetable_entries
      SET exam_date = ?, exam_time = ?
      WHERE id = ?
      `,
      [exam_date, exam_time, entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Timetable entry not found" });
    }

    return res.json({
      success: true,
      message: "Timetable entry updated successfully",
    });
  } catch (err) {
    console.error("Update Timetable Entry Error:", err);
    return res.status(500).json({ error: "Failed to update timetable entry" });
  }
};

/**
 * Get exam timetable for student (view what exams they have)
 */
export const getStudentExamTimetable = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Get student's registered units for current term
    const [studentUnits] = await db.execute(
      `
      SELECT DISTINCT
        su.unit_id,
        su.term,
        u.unit_code,
        u.unit_name,
        u.course_id,
        c.course_code,
        c.course_name
      FROM student_units su
      LEFT JOIN units u ON u.unit_id = su.unit_id
      LEFT JOIN courses c ON c.course_id = u.course_id
      WHERE su.student_id = ?
      ORDER BY su.term, u.unit_code
      `,
      [studentId]
    );

    if (studentUnits.length === 0) {
      return res.json({
        success: true,
        timetable: [],
        message: "No registered units found for this student",
      });
    }

    // Get exam schedules for these units
    const [exams] = await db.execute(
      `
      SELECT
        ete.id,
        ete.exam_date,
        ete.exam_time,
        u.unit_code,
        u.unit_name,
        c.course_code,
        c.course_name,
        es.max_marks,
        es.pass_marks
      FROM exam_timetable_entries ete
      LEFT JOIN units u ON u.unit_id = ete.unit_id
      LEFT JOIN courses c ON c.course_id = ete.course_id
      LEFT JOIN exam_schedules es ON es.unit_id = ete.unit_id
      WHERE ete.unit_id IN (${studentUnits.map(() => "?").join(",")})
      ORDER BY ete.exam_date, ete.exam_time
      `,
      studentUnits.map((u) => u.unit_id)
    );

    return res.json({
      success: true,
      timetable: exams,
      unit_count: studentUnits.length,
    });
  } catch (err) {
    console.error("Get Student Exam Timetable Error:", err);
    return res.status(500).json({ error: "Failed to load exam timetable" });
  }
};
