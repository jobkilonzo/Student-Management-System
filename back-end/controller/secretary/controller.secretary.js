import db from "../../database/mysql_database.js";
import bcrypt from "bcryptjs";
import moment from "moment";
import { generateRegNo } from "../auth.controller.js";
import { applyCourseFeesToStudent } from "../../services/studentFees.js";

const forbiddenSecretaryFields = new Set(["address", "dob", "id_number", "reg_no", "gender"]);

const hasForbiddenKeys = (obj = {}) => {
  for (const key of Object.keys(obj || {})) {
    if (forbiddenSecretaryFields.has(key)) return key;
  }
  return null;
};

const DEFAULT_STUDENT_PASSWORD = "students";
const makeTempPassword = () => DEFAULT_STUDENT_PASSWORD;

const safeLowerEmail = (email) => (email ? String(email).trim().toLowerCase() : null);
const safeNull = (v) => (v === undefined || v === "" ? null : v);

const toIntOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const courseKindFromName = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("craft")) return "craft";
  if (n.includes("diploma")) return "diploma";
  return "other";
};

export const registerStudentBySecretary = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id;

    let {
      first_name,
      middle_name,
      last_name,
      email,
      gender,
      course_id,
      phone,
      address,
      guardian_name,
      guardian_phone,
      dob,
      id_number,
      module,
      term,
      selected_fee_ids,
    } = req.body || {};

    email = safeLowerEmail(email);
    course_id = Number(course_id);
    const moduleNum = toIntOrNull(module);
    const termNum = toIntOrNull(term);

    if (!first_name || !last_name || !email || !gender || !course_id) {
      connection.release();
      return res.status(400).json({ error: "first_name, last_name, email, gender, course_id are required" });
    }

    await connection.beginTransaction();

    const [existingUser] = await connection.execute(
      "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
      [email]
    );
    if (existingUser.length) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const [courseRows] = await connection.execute(
      "SELECT course_id, course_code, course_name, course_type FROM courses WHERE course_id = ? LIMIT 1",
      [course_id]
    );
    if (!courseRows.length) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Invalid course_id" });
    }

    const courseType = courseRows[0]?.course_type || "modular";
    const isNonModular = courseType === "non_modular";

    // term is required for all course types
    if (!Number.isFinite(termNum)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "term must be a number" });
    }

    if (![1, 2, 3].includes(Number(termNum))) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "term must be 1, 2, or 3" });
    }

    // module is only required for modular/stage-based/etc courses
    if (!isNonModular) {
      if (!Number.isFinite(moduleNum)) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: "module must be a number" });
      }

      const courseKind = courseKindFromName(courseRows[0]?.course_name);
      const allowedModules = courseKind === "craft" ? [1, 2] : [1, 2, 3];
      if (!allowedModules.includes(Number(moduleNum))) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: courseKind === "craft" ? "For Craft, module must be 1 or 2" : "module must be 1, 2, or 3",
        });
      }
    }

    const temp_password = makeTempPassword();
    const hashedPassword = await bcrypt.hash(temp_password, 10);

    // Create user (student only)
    const [userResult] = await connection.execute(
      `INSERT INTO users
       (first_name, middle_name, last_name, email, password, role, gender, created_at, must_change_password)
       VALUES (?, ?, ?, ?, ?, 'student', ?, NOW(), 1)`,
      [first_name, safeNull(middle_name), last_name, email, hashedPassword, gender]
    );
    const user_id = userResult.insertId;

    // Generate reg_no using existing auth controller helper
    const reg_no = await generateRegNo(connection, course_id, courseRows[0].course_code);

    const [studentResult] = await connection.execute(
      `INSERT INTO students
       (user_id, reg_no, first_name, middle_name, last_name, email, course_id, module, term, phone, address,
        guardian_name, guardian_phone, dob, id_number, gender, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        reg_no,
        first_name,
        safeNull(middle_name),
        last_name,
        email,
        course_id,
        isNonModular ? null : Number(moduleNum),
        Number(termNum),
        safeNull(phone),
        safeNull(address),
        safeNull(guardian_name),
        safeNull(guardian_phone),
        safeNull(dob) ? moment(dob).format("YYYY-MM-DD") : null,
        safeNull(id_number),
        gender,
        moment().format("YYYY-MM-DD HH:mm:ss"),
        moment().format("YYYY-MM-DD HH:mm:ss"),
      ]
    );

    const student_id = studentResult.insertId;

    const hasSelectedFeeIds = Object.prototype.hasOwnProperty.call(req.body || {}, "selected_fee_ids");
    const selectedFeeIds = Array.isArray(selected_fee_ids)
      ? selected_fee_ids
      : selected_fee_ids
        ? String(selected_fee_ids).split(",")
        : [];

    const appliedFees = await applyCourseFeesToStudent(connection, {
      studentId: student_id,
      courseId: course_id,
      module: isNonModular ? null : Number(moduleNum),
      term: Number(termNum),
      selectedFeeIds,
      actorId,
      applyAllWhenEmpty: !hasSelectedFeeIds,
    });

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        actorId,
        "SECRETARY_CREATE_STUDENT",
        student_id,
        JSON.stringify({ user_id, student_id, reg_no, course_id }),
      ]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      user_id,
      student_id,
      reg_no,
      temp_password,
      must_change_password: true,
      fees_applied: appliedFees.applied,
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Secretary register student error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

export const getStudentsBySecretary = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const course_id = req.query.course_id ? Number(req.query.course_id) : null;

    // parse module: allow numeric module or 'non-modular' (meaning module IS NULL)
    const rawModule = req.query.module;
    let module = null;
    let moduleIsNonModular = false;
    if (rawModule !== undefined && rawModule !== null && String(rawModule).trim() !== "") {
      const mstr = String(rawModule).trim();
      const ml = mstr.toLowerCase();
      if (ml === "non-modular" || ml === "non modular" || ml === "non-modulars" || ml === "non modulars" || ml === "nonmodular") {
        moduleIsNonModular = true;
      } else {
        const mnum = Number(mstr);
        if (!Number.isFinite(mnum)) return res.status(400).json({ error: "module must be a number or 'non-modular'" });
        module = mnum;
      }
    }

    // parse term: must be a number when provided
    const rawTerm = req.query.term;
    let term = null;
    if (rawTerm !== undefined && rawTerm !== null && String(rawTerm).trim() !== "") {
      const tnum = Number(String(rawTerm).trim());
      if (!Number.isFinite(tnum)) return res.status(400).json({ error: "term must be a number" });
      term = tnum;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = ["s.deleted_at IS NULL"];
    const params = [];

    if (course_id) { where.push("s.course_id = ?"); params.push(course_id); }
    if (moduleIsNonModular) { where.push("s.module IS NULL"); }
    else if (module !== null) { where.push("s.module = ?"); params.push(module); }
    if (term !== null) { where.push("s.term = ?"); params.push(term); }

    if (search) {
      where.push(`(
        s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ? OR s.reg_no LIKE ? OR c.course_name LIKE ?
      )`);
      const q = `%${search}%`;
      params.push(q, q, q, q, q);
    }

    const [[countRow]] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM students s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN courses c ON c.course_id = s.course_id
      WHERE ${where.join(" AND ")}
      `,
      params
    );

    const [rows] = await db.execute(
      `
      SELECT
        s.id AS student_id,
        s.reg_no,
        TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)) AS full_name,
        s.email,
        s.phone,
        s.module,
        s.term,
        s.guardian_name,
        s.guardian_phone,
        c.course_id,
        c.course_name,
        c.course_code,
        u.id AS user_id,
        u.created_at
      FROM students s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN courses c ON c.course_id = s.course_id
      WHERE ${where.join(" AND ")}
      ORDER BY u.created_at DESC, s.createdAt DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    return res.json({
      success: true,
      page,
      limit,
      total: Number(countRow?.total || 0),
      students: rows,
    });
  } catch (err) {
    console.error("Secretary get students error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getStudentByIdForSecretary = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        s.*,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.middle_name AS user_middle_name,
        u.last_name AS user_last_name,
        c.course_name,
        c.course_code
      FROM students s
      LEFT JOIN users u
        ON u.id = s.user_id
      LEFT JOIN courses c
        ON c.course_id = s.course_id
      WHERE s.id = ?
        AND s.deleted_at IS NULL
      LIMIT 1
      `,
      [Number(id)]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    const student = rows[0];

    const [units] = await db.execute(
      `
      SELECT
        su.student_id,
        su.unit_id,
        su.module,
        su.term,
        su.status AS assigned_status,
        u.unit_code,
        u.unit_name,
        CASE
          WHEN COALESCE(m.exam_mark, 0) > 0
            OR COALESCE(m.total, 0) > 0
          THEN 'Completed'
          ELSE su.status
        END AS status
      FROM student_units su
      JOIN units u
        ON u.unit_id = su.unit_id
      LEFT JOIN marks m
        ON m.student_id = su.student_id
        AND m.unit_id = su.unit_id
        AND m.term = su.term
      WHERE su.student_id = ?
      ORDER BY u.unit_code
      `,
      [Number(id)]
    );

    const [notifications] = await db.execute(
      `
      SELECT
        id,
        type,
        title,
        message,
        is_read,
        created_at,
        created_by
      FROM student_notifications
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [Number(id)]
    );

    return res.json({
      success: true,
      student,
      units,
      notifications,
    });

  } catch (err) {
    console.error("Secretary get student by id error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

export const updateStudentBySecretary = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id;
    const forbiddenKey = hasForbiddenKeys(req.body || {});
    if (forbiddenKey) {
      connection.release();
      return res.status(400).json({ error: `Field '${forbiddenKey}' cannot be updated by secretary` });
    }

    const { id } = req.params;
    let {
      // users
      first_name,
      middle_name,
      last_name,
      email,
      // students
      phone,
      guardian_name,
      guardian_phone,
      module,
      term,
      course_id,
    } = req.body || {};

    const normalizedEmail = email !== undefined ? safeLowerEmail(email) : undefined;
    const nextCourseId = course_id !== undefined ? Number(course_id) : undefined;

    await connection.beginTransaction();

    const [currentRows] = await connection.execute(
      `
      SELECT s.id, s.user_id, s.course_id, s.module, s.term,
             u.first_name, u.middle_name, u.last_name, u.email
      FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.deleted_at IS NULL
      LIMIT 1 FOR UPDATE
      `,
      [Number(id)]
    );
    if (!currentRows.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Student not found" });
    }

    const current = currentRows[0];
    const oldValues = {
      user: {
        first_name: current.first_name,
        middle_name: current.middle_name,
        last_name: current.last_name,
        email: current.email,
      },
      student: {
        course_id: current.course_id,
        module: current.module,
        term: current.term,
        phone: null,
        guardian_name: null,
        guardian_phone: null,
      },
    };

    const [studentOnly] = await connection.execute(
      "SELECT phone, guardian_name, guardian_phone FROM students WHERE id = ? LIMIT 1 FOR UPDATE",
      [Number(id)]
    );
    if (studentOnly.length) {
      oldValues.student.phone = studentOnly[0].phone;
      oldValues.student.guardian_name = studentOnly[0].guardian_name;
      oldValues.student.guardian_phone = studentOnly[0].guardian_phone;
    }

    // email uniqueness if changing
    if (normalizedEmail && normalizedEmail !== current.email) {
      const [existingEmail] = await connection.execute(
        "SELECT id FROM users WHERE email = ? AND id <> ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
        [normalizedEmail, Number(current.user_id)]
      );
      if (existingEmail.length) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ error: "Email is already in use" });
      }
    }

    const userFields = [];
    const userValues = [];
    if (first_name) { userFields.push("first_name = ?"); userValues.push(first_name); }
    if (middle_name !== undefined) { userFields.push("middle_name = ?"); userValues.push(middle_name); }
    if (last_name) { userFields.push("last_name = ?"); userValues.push(last_name); }
    if (normalizedEmail !== undefined) { userFields.push("email = ?"); userValues.push(normalizedEmail); }

    if (userFields.length) {
      userValues.push(Number(current.user_id));
      await connection.execute(`UPDATE users SET ${userFields.join(", ")} WHERE id = ?`, userValues);
    }

    const studentFields = [];
    const studentValues = [];
    if (phone !== undefined) { studentFields.push("phone = ?"); studentValues.push(safeNull(phone)); }
    if (guardian_name !== undefined) { studentFields.push("guardian_name = ?"); studentValues.push(safeNull(guardian_name)); }
    if (guardian_phone !== undefined) { studentFields.push("guardian_phone = ?"); studentValues.push(safeNull(guardian_phone)); }
    if (module !== undefined) { studentFields.push("module = ?"); studentValues.push(safeNull(module)); }
    if (term !== undefined) { studentFields.push("term = ?"); studentValues.push(safeNull(term)); }
    if (nextCourseId !== undefined) { studentFields.push("course_id = ?"); studentValues.push(nextCourseId); }

    let courseChanged = false;
    if (nextCourseId !== undefined && Number(nextCourseId) !== Number(current.course_id)) {
      courseChanged = true;

      const [courseRows] = await connection.execute(
        "SELECT course_id, course_code, course_name FROM courses WHERE course_id = ? LIMIT 1",
        [Number(current.course_id)]
      );
      const oldCourse = courseRows[0] || {};

      await connection.execute(
        `INSERT INTO student_progressions
         (student_id, course_id, course_code, course_name, module, term, fee_amount, changed_by, archived_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`,
        [
          Number(id),
          Number(current.course_id),
          oldCourse.course_code || null,
          oldCourse.course_name || null,
          current.module || null,
          current.term || null,
          actorId,
        ]
      );
    }

    if (studentFields.length) {
      studentFields.push("updatedAt = ?");
      studentValues.push(moment().format("YYYY-MM-DD HH:mm:ss"));
      studentValues.push(Number(id));
      await connection.execute(`UPDATE students SET ${studentFields.join(", ")} WHERE id = ?`, studentValues);
    }

    const [newSnapshotRows] = await connection.execute(
      `
      SELECT s.course_id, s.module, s.term, s.phone, s.guardian_name, s.guardian_phone,
             u.first_name, u.middle_name, u.last_name, u.email
      FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? LIMIT 1
      `,
      [Number(id)]
    );
    const snap = newSnapshotRows[0] || {};

    const newValues = {
      user: {
        first_name: snap.first_name,
        middle_name: snap.middle_name,
        last_name: snap.last_name,
        email: snap.email,
      },
      student: {
        course_id: snap.course_id,
        module: snap.module,
        term: snap.term,
        phone: snap.phone,
        guardian_name: snap.guardian_name,
        guardian_phone: snap.guardian_phone,
      },
    };

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        actorId,
        "SECRETARY_UPDATE_STUDENT",
        Number(id),
        JSON.stringify({ old: oldValues, new: newValues, course_changed: courseChanged }),
      ]
    );

    await connection.commit();
    connection.release();
    return res.json({ success: true, message: "Student updated successfully", course_changed: courseChanged });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Secretary update student error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

export const assignUnitsToStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const actorId = req.user?.id;
    const studentId = Number(req.params.id);

    await connection.beginTransaction();

    /**
     * STEP 1: FETCH STUDENT
     */
    const [studentRows] = await connection.execute(
      `
      SELECT
        s.id,
        s.course_id,
        s.module,
        s.term,
        s.deleted_at,
        c.course_type
      FROM students s
      LEFT JOIN courses c ON c.course_id = s.course_id
      WHERE s.id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [studentId]
    );

    if (!studentRows.length || studentRows[0].deleted_at) {
      await connection.rollback();
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentRows[0];
    const courseId = Number(student.course_id);

    const courseType = String(student.course_type || "").toLowerCase();
    const isModular = [
      "modular",
      "grade_based",
      "stage_based",
      "level_based",
    ].includes(courseType);

    const module =
      student.module !== null && student.module !== undefined
        ? Number(student.module)
        : null;

    const term =
      student.term !== null && student.term !== undefined
        ? Number(student.term)
        : null;



    /**
     * STEP 2: VALIDATION
     */
    if (isModular && (!module || Number.isNaN(module))) {
      await connection.rollback();
      return res.status(400).json({
        error: "Module is required for modular courses",
      });
    }

    /**
     * STEP 3: FETCH UNITS (FIXED - NO DISTINCT ISSUE)
     */
    let unitsQuery = `
      SELECT unit_id, unit_code
      FROM units
      WHERE course_id = ?
    `;

    const queryParams = [courseId];

    if (isModular) {
      unitsQuery += ` AND module = ? `;
      queryParams.push(module);
    } else {
      unitsQuery += ` AND (module IS NULL OR module = '') `;
    }

    unitsQuery += ` ORDER BY unit_code ASC `;

    const [units] = await connection.execute(unitsQuery, queryParams);

    if (!units.length) {
      await connection.rollback();
      return res.status(400).json({ error: "No matching units found" });
    }

    /**
     * STEP 4: CHECK EXISTING ASSIGNMENTS
     */
    const [existingUnits] = await connection.execute(
      `
      SELECT unit_id
      FROM student_units
      WHERE student_id = ?
      `,
      [studentId]
    );

    const existingUnitIds = new Set(
      existingUnits.map((u) => Number(u.unit_id))
    );

    /**
     * STEP 5: INSERT UNITS
     */
    let inserted = 0;

    for (const unit of units) {
      const unitId = Number(unit.unit_id);

      if (existingUnitIds.has(unitId)) continue;

      const [result] = await connection.execute(
        `
        INSERT INTO student_units (
          student_id,
          unit_id,
          module,
          term,
          status,
          assigned_by
        )
        VALUES (?, ?, ?, ?, 'In Progress', ?)
        `,
        [
          studentId,
          unitId,
          isModular ? module : null,
          term,
          actorId,
        ]
      );

      if (result.affectedRows > 0) inserted++;
    }

    /**
     * STEP 6: AUDIT LOG
     */
    await connection.execute(
      `
      INSERT INTO audit_logs (
        user_id,
        action,
        target_id,
        details,
        created_at
      )
      VALUES (?, ?, ?, ?, NOW())
      `,
      [
        actorId,
        "ASSIGN_UNITS",
        studentId,
        JSON.stringify({
          student_id: studentId,
          course_id: courseId,
          module,
          term,
          is_modular: isModular,
          units_assigned: inserted,
        }),
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: "Units assigned successfully",
      assigned: inserted,
    });

  } catch (err) {
    await connection.rollback();

    console.error("Assign units error:", err);

    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });

  } finally {
    connection.release();
  }
};

export const getStudentUnits = async (req, res) => {
  try {
    const { id } = req.params; // student_id

    const [rows] = await db.execute(
      `
      SELECT
        su.student_id,
        su.unit_id,
        su.module,
        su.term,
        su.status AS assigned_status,
        u.unit_code,
        u.unit_name,
        CASE
          WHEN COALESCE(m.exam_mark, 0) > 0
            OR COALESCE(m.total, 0) > 0
          THEN 'Completed'
          ELSE su.status
        END AS status
      FROM student_units su
      JOIN units u
        ON u.unit_id = su.unit_id
      LEFT JOIN marks m
        ON m.student_id = su.student_id
        AND m.unit_id = su.unit_id
        AND m.term = su.term
      WHERE su.student_id = ?
      ORDER BY u.unit_code
      `,
      [Number(id)]
    );

    return res.json({
      success: true,
      units: rows,
    });

  } catch (err) {
    console.error("Get student units error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

export const exportStudentListCsv = async (req, res) => {
  try {
    const actorId = req.user?.id;
    const course_id = req.query.course_id ? Number(req.query.course_id) : null;

    // parse module/term for export: support numeric or 'non-modular'
    const rawModule = req.query.module;
    let module = null;
    let moduleIsNonModular = false;
    if (rawModule !== undefined && rawModule !== null && String(rawModule).trim() !== "") {
      const mstr = String(rawModule).trim();
      const ml = mstr.toLowerCase();
      if (ml === "non-modular" || ml === "non modular" || ml === "non-modulars" || ml === "non modulars" || ml === "nonmodular") {
        moduleIsNonModular = true;
      } else {
        const mnum = Number(mstr);
        if (!Number.isFinite(mnum)) return res.status(400).json({ error: "module must be a number or 'non-modular'" });
        module = mnum;
      }
    }

    const rawTerm = req.query.term;
    let term = null;
    if (rawTerm !== undefined && rawTerm !== null && String(rawTerm).trim() !== "") {
      const tnum = Number(String(rawTerm).trim());
      if (!Number.isFinite(tnum)) return res.status(400).json({ error: "term must be a number" });
      term = tnum;
    }

    const where = ["s.deleted_at IS NULL"];
    const params = [];
    if (course_id) { where.push("s.course_id = ?"); params.push(course_id); }
    if (moduleIsNonModular) { where.push("s.module IS NULL"); }
    else if (module !== null) { where.push("s.module = ?"); params.push(module); }
    if (term !== null) { where.push("s.term = ?"); params.push(term); }

    const [rows] = await db.execute(
      `
      SELECT
        s.reg_no,
        TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)) AS student_name,
        s.email,
        s.phone,
        c.course_name,
        s.module,
        s.term,
        s.guardian_name
      FROM students s
      LEFT JOIN courses c ON c.course_id = s.course_id
      WHERE ${where.join(" AND ")}
      ORDER BY s.createdAt DESC
      `,
      params
    );

    const { Parser } = await import("json2csv");
    const parser = new Parser({
      fields: ["reg_no", "student_name", "email", "phone", "course_name", "module", "term", "guardian_name"],
    });
    const csv = parser.parse(rows);

    await db.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "SECRETARY_EXPORT_CSV", null, JSON.stringify({ course_id, module, term, rows: rows.length })]
    );

    res.header("Content-Type", "text/csv");
    res.attachment("students_export.csv");
    res.send(csv);
  } catch (err) {
    console.error("Export CSV error:", err);
    res.status(500).json({ error: "Export failed" });
  }
};

export const exportStudentListPdfData = async (req, res) => {
  // PDF generation is done on the client using jsPDF (existing frontend deps).
  try {
    const actorId = req.user?.id;
    const course_id = req.query.course_id ? Number(req.query.course_id) : null;

    // parse module/term for export: support numeric or 'non-modular'
    const rawModule = req.query.module;
    let module = null;
    let moduleIsNonModular = false;
    if (rawModule !== undefined && rawModule !== null && String(rawModule).trim() !== "") {
      const mstr = String(rawModule).trim();
      const ml = mstr.toLowerCase();
      if (ml === "non-modular" || ml === "non modular" || ml === "non-modulars" || ml === "non modulars" || ml === "nonmodular") {
        moduleIsNonModular = true;
      } else {
        const mnum = Number(mstr);
        if (!Number.isFinite(mnum)) return res.status(400).json({ error: "module must be a number or 'non-modular'" });
        module = mnum;
      }
    }

    const rawTerm = req.query.term;
    let term = null;
    if (rawTerm !== undefined && rawTerm !== null && String(rawTerm).trim() !== "") {
      const tnum = Number(String(rawTerm).trim());
      if (!Number.isFinite(tnum)) return res.status(400).json({ error: "term must be a number" });
      term = tnum;
    }

    const where = ["s.deleted_at IS NULL"];
    const params = [];
    if (course_id) { where.push("s.course_id = ?"); params.push(course_id); }
    if (moduleIsNonModular) { where.push("s.module IS NULL"); }
    else if (module !== null) { where.push("s.module = ?"); params.push(module); }
    if (term !== null) { where.push("s.term = ?"); params.push(term); }

    const [rows] = await db.execute(
      `
      SELECT
        s.reg_no,
        TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)) AS student_name,
        s.email,
        s.phone,
        c.course_name,
        s.module,
        s.term,
        s.guardian_name
      FROM students s
      LEFT JOIN courses c ON c.course_id = s.course_id
      WHERE ${where.join(" AND ")}
      ORDER BY s.createdAt DESC
      `,
      params
    );

    await db.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "SECRETARY_EXPORT_PDF", null, JSON.stringify({ course_id, module, term, rows: rows.length })]
    );

    res.json({ success: true, rows });
  } catch (err) {
    console.error("Export PDF data error:", err);
    res.status(500).json({ error: "Export failed" });
  }
};

export const sendNotificationToStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id;
    const { id } = req.params; // student_id
    const { type, title, message } = req.body || {};

    if (!type || !title || !message) {
      connection.release();
      return res.status(400).json({ error: "type, title, message are required" });
    }

    await connection.beginTransaction();

    const [studentRows] = await connection.execute(
      "SELECT id FROM students WHERE id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE",
      [Number(id)]
    );
    if (!studentRows.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Student not found" });
    }

    const [result] = await connection.execute(
      `INSERT INTO student_notifications (student_id, type, title, message, is_read, created_by, created_at)
       VALUES (?, ?, ?, ?, 0, ?, NOW())`,
      [Number(id), type, title, message, actorId]
    );

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "SEND_NOTIFICATION", Number(id), JSON.stringify({ student_id: Number(id), type, notification_id: result.insertId })]
    );

    await connection.commit();
    connection.release();
    return res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Send notification error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

export const getStudentNotificationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      `
      SELECT sn.id, sn.student_id, sn.type, sn.title, sn.message, sn.is_read, sn.created_at, sn.created_by
      FROM student_notifications sn
      WHERE sn.student_id = ?
      ORDER BY sn.created_at DESC
      LIMIT 200
      `,
      [Number(id)]
    );
    return res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error("Get student notification history error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const listStudentNotifications = async (req, res) => {
  try {
    const student_id = req.query.student_id ? Number(req.query.student_id) : null;
    const type = req.query.type ? String(req.query.type) : null;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = ["s.deleted_at IS NULL"];
    const params = [];
    if (student_id) { where.push("sn.student_id = ?"); params.push(student_id); }
    if (type) { where.push("sn.type = ?"); params.push(type); }

    const [[countRow]] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM student_notifications sn
      JOIN students s ON s.id = sn.student_id
      WHERE ${where.join(" AND ")}
      `,
      params
    );

    const [rows] = await db.execute(
      `
      SELECT
        sn.id,
        sn.type,
        sn.title,
        sn.message,
        sn.is_read,
        sn.created_at,
        sn.student_id,
        s.reg_no,
        TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)) AS student_name
      FROM student_notifications sn
      JOIN students s ON s.id = sn.student_id
      WHERE ${where.join(" AND ")}
      ORDER BY sn.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    return res.json({ success: true, page, limit, total: Number(countRow?.total || 0), notifications: rows });
  } catch (err) {
    console.error("List student notifications error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const feeReminderToStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const actorId = req.user?.id;
    const { student_id } = req.params;

    await connection.beginTransaction();

    const [studentRows] = await connection.execute(
      `SELECT id, reg_no, first_name, middle_name, last_name
       FROM students WHERE id = ? AND deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [Number(student_id)]
    );
    if (!studentRows.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Student not found" });
    }

    const s = studentRows[0];
    const title = "Fee Reminder";
    const message = `Dear ${s.first_name || "student"}, please remember to clear any outstanding fees. Contact the office for assistance.`;

    const [result] = await connection.execute(
      `INSERT INTO student_notifications (student_id, type, title, message, is_read, created_by, created_at)
       VALUES (?, 'fee_reminder', ?, ?, 0, ?, NOW())`,
      [Number(student_id), title, message, actorId]
    );

    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [actorId, "SEND_FEE_REMINDER", Number(student_id), JSON.stringify({ student_id: Number(student_id), notification_id: result.insertId })]
    );

    await connection.commit();
    connection.release();
    return res.json({ success: true, message: "Reminder sent" });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Fee reminder error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getSecretaryAuditLogs = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const action = req.query.action ? String(req.query.action) : null;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = ["1=1"];
    const params = [];
    if (action) { where.push("a.action = ?"); params.push(action); }
    if (search) { where.push("(a.details LIKE ? OR CAST(a.target_id AS CHAR) LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }

    const [[countRow]] = await db.execute(
      `SELECT COUNT(*) AS total FROM audit_logs a WHERE ${where.join(" AND ")}`,
      params
    );

    const [rows] = await db.execute(
      `
      SELECT a.id, a.user_id, a.action, a.target_id, a.created_at, a.details
      FROM audit_logs a
      WHERE ${where.join(" AND ")}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    return res.json({ success: true, page, limit, total: Number(countRow?.total || 0), logs: rows });
  } catch (err) {
    console.error("Get secretary audit logs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getSecretaryDashboard = async (req, res) => {
  try {
    const [[totalStudents]] = await db.execute(
      "SELECT COUNT(*) AS total FROM students WHERE deleted_at IS NULL"
    );

    const [byCourse] = await db.execute(
      `
      SELECT c.course_name, COUNT(*) AS count
      FROM students s
      LEFT JOIN courses c ON c.course_id = s.course_id
      WHERE s.deleted_at IS NULL
      GROUP BY c.course_name
      ORDER BY count DESC
      `
    );

    const [recentEnrollments] = await db.execute(
      `
      SELECT s.id, s.reg_no, TRIM(CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name)) AS name,
             c.course_name, s.createdAt
      FROM students s
      LEFT JOIN courses c ON c.course_id = s.course_id
      WHERE s.deleted_at IS NULL AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY s.createdAt DESC
      LIMIT 20
      `
    );

    const [recentAudit] = await db.execute(
      `
      SELECT id, action, target_id, created_at, details
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 10
      `
    );

    return res.json({
      success: true,
      stats: {
        total_students: Number(totalStudents?.total || 0),
      },
      students_by_course: byCourse.map((r) => ({ course_name: r.course_name || "Unknown", count: Number(r.count) })),
      recent_enrollments: recentEnrollments,
      recent_activity: recentAudit,
    });
  } catch (err) {
    console.error("Secretary dashboard error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
