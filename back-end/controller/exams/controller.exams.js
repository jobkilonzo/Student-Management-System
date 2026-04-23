import db from "../../database/mysql_database.js";

const toNull = (v) => (v === undefined || v === "" ? null : v);

export const listExamSchedules = async (req, res) => {
  try {
    const { unit_id, course_id } = req.query || {};

    const where = [];
    const params = [];

    if (unit_id) { where.push("es.unit_id = ?"); params.push(Number(unit_id)); }
    if (course_id) { where.push("es.course_id = ?"); params.push(Number(course_id)); }

    const [rows] = await db.execute(
      `
      SELECT
        es.id,
        es.unit_id,
        es.course_id,
        es.module,
        es.exam_date,
        es.max_marks,
        es.pass_marks,
        es.marks_allowed_from,
        es.marks_allowed_to,
        es.created_by,
        es.created_at,
        es.updated_at,
        u.unit_code,
        u.unit_name,
        c.course_code,
        c.course_name
      FROM exam_schedules es
      LEFT JOIN units u ON u.unit_id = es.unit_id
      LEFT JOIN courses c ON c.course_id = es.course_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY es.updated_at DESC, es.created_at DESC
      `,
      params
    );

    return res.json({ success: true, schedules: rows });
  } catch (err) {
    console.error("List Exam Schedules Error:", err);
    return res.status(500).json({ error: "Failed to load exam schedules" });
  }
};

export const createExamSchedule = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id || null;
    let {
      unit_id,
      course_id,
      module,
      exam_date,
      max_marks,
      pass_marks,
      marks_allowed_from,
      marks_allowed_to,
    } = req.body || {};

    unit_id = Number(unit_id);
    course_id = Number(course_id);

    if (!unit_id || !course_id) {
      connection.release();
      return res.status(400).json({ error: "unit_id and course_id are required" });
    }

    await connection.beginTransaction();

    const [[unit]] = await connection.execute(
      "SELECT unit_id, course_id FROM units WHERE unit_id = ? LIMIT 1 FOR UPDATE",
      [unit_id]
    );
    if (!unit) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Invalid unit_id" });
    }

    if (Number(unit.course_id) !== course_id) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "course_id does not match unit course" });
    }

    const [result] = await connection.execute(
      `
      INSERT INTO exam_schedules
        (unit_id, course_id, module, exam_date, max_marks, pass_marks, marks_allowed_from, marks_allowed_to, created_by)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        unit_id,
        course_id,
        toNull(module),
        toNull(exam_date),
        Number(max_marks ?? 100),
        Number(pass_marks ?? 40),
        toNull(marks_allowed_from),
        toNull(marks_allowed_to),
        actorId,
      ]
    );

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "CREATE_EXAM_SCHEDULE", result.insertId, `Created exam schedule for unit ${unit_id}`]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Create Exam Schedule Error:", err);
    return res.status(500).json({ error: "Failed to create exam schedule" });
  }
};

export const updateExamSchedule = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id || null;
    const { id } = req.params;
    const {
      module,
      exam_date,
      max_marks,
      pass_marks,
      marks_allowed_from,
      marks_allowed_to,
    } = req.body || {};

    const updateFields = [];
    const updateValues = [];

    if (module !== undefined) { updateFields.push("module = ?"); updateValues.push(toNull(module)); }
    if (exam_date !== undefined) { updateFields.push("exam_date = ?"); updateValues.push(toNull(exam_date)); }
    if (max_marks !== undefined) { updateFields.push("max_marks = ?"); updateValues.push(Number(max_marks)); }
    if (pass_marks !== undefined) { updateFields.push("pass_marks = ?"); updateValues.push(Number(pass_marks)); }
    if (marks_allowed_from !== undefined) { updateFields.push("marks_allowed_from = ?"); updateValues.push(toNull(marks_allowed_from)); }
    if (marks_allowed_to !== undefined) { updateFields.push("marks_allowed_to = ?"); updateValues.push(toNull(marks_allowed_to)); }

    if (!updateFields.length) {
      connection.release();
      return res.status(400).json({ error: "No fields to update" });
    }

    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT * FROM exam_schedules WHERE id = ? LIMIT 1 FOR UPDATE",
      [id]
    );
    if (!existing.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Exam schedule not found" });
    }

    updateValues.push(id);
    await connection.execute(
      `UPDATE exam_schedules SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "UPDATE_EXAM_SCHEDULE", Number(id), `Updated exam schedule fields: ${updateFields.map(f => f.split(" = ")[0]).join(", ")}`]
    );

    await connection.commit();
    connection.release();
    return res.json({ success: true, message: "Exam schedule updated" });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Update Exam Schedule Error:", err);
    return res.status(500).json({ error: "Failed to update exam schedule" });
  }
};

export const deleteExamSchedule = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id || null;
    const { id } = req.params;

    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT id FROM exam_schedules WHERE id = ? LIMIT 1 FOR UPDATE",
      [id]
    );
    if (!existing.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Exam schedule not found" });
    }

    await connection.execute("DELETE FROM exam_schedules WHERE id = ?", [id]);

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "DELETE_EXAM_SCHEDULE", Number(id), "Deleted exam schedule"]
    );

    await connection.commit();
    connection.release();

    return res.json({ success: true, message: "Exam schedule deleted" });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Delete Exam Schedule Error:", err);
    return res.status(500).json({ error: "Failed to delete exam schedule" });
  }
};

