import db from "../../database/mysql_database.js";
import moment from "moment";
import XLSX from "xlsx";

// BULK IMPORT STUDENTS FROM EXCEL
export const importStudentsExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Excel file is required" });

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const errors = [];
    const successes = [];

    for (const row of data) {
      const {
        first_name,
        middle_name,
        last_name,
        gender,
        dob,
        id_number,
        phone,
        email,
        course_code,
        module,
        term,
        guardian_name,
        guardian_phone,
        address,
      } = row;

      if (!first_name || !last_name || !gender || !course_code || !module || !term) {
        errors.push({ row, error: "Missing required fields" });
        continue;
      }

      try {
        // Get course_id from course_code
        const [courseResults] = await db.execute(
          "SELECT course_id FROM courses WHERE course_code = ?",
          [course_code]
        );

        if (courseResults.length === 0) {
          errors.push({ row, error: `Course code ${course_code} not found` });
          continue;
        }

        const course_id = courseResults[0].course_id;
        const reg_no = await generateRegNo(course_id, course_code);

        const insertQuery = `
          INSERT INTO students
          (reg_no, first_name, middle_name, last_name, gender, dob, id_number, phone, email, course_id, module, term, guardian_name, guardian_phone, address, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          reg_no,
          first_name,
          middle_name || null,
          last_name,
          gender,
          dob ? moment(dob).format("YYYY-MM-DD") : null,
          id_number || null,
          phone || null,
          email || null,
          course_id,
          module,
          term,
          guardian_name || null,
          guardian_phone || null,
          address || null,
          moment().format("YYYY-MM-DD HH:mm:ss"),
        ];

        await db.execute(insertQuery, values);
        successes.push({ reg_no, first_name, middle_name, last_name });
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Import finished: ${successes.length} succeeded, ${errors.length} failed`,
      successes,
      errors,
    });
  } catch (err) {
    console.error("Excel import error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Generate registration number
const generateRegNo = async (courseId, courseCode) => {
  const year = moment().format("YYYY");
  const [countResults] = await db.execute(
    "SELECT COUNT(*) AS total FROM students WHERE course_id=? AND YEAR(createdAt)=?",
    [courseId, year]
  );
  const nextNumber = (countResults[0].total || 0) + 1;
  return `JP/${courseCode}/${year}/${String(nextNumber).padStart(3, "0")}`;
};

// ADD single student
export const addStudent = async (req, res) => {
  try {
    const body = req.body || {};
    let {
      first_name,
      middle_name,
      last_name,
      gender,
      dob,
      id_number,
      phone,
      email,
      course_id,
      module,
      term,
      guardian_name,
      guardian_phone,
      address,
    } = body;

    course_id = parseInt(course_id);

    if (!first_name || !last_name || !gender || !course_id || !module || !term) {
      return res.status(400).json({
        error: "Missing required fields: first_name, last_name, gender, course_id, module, term",
      });
    }

    // Get course code
    const [courseResults] = await db.execute(
      "SELECT course_code FROM courses WHERE course_id = ?",
      [course_id]
    );

    if (courseResults.length === 0) return res.status(400).json({ error: "Invalid course_id" });

    const courseCode = courseResults[0].course_code;
    const reg_no = await generateRegNo(course_id, courseCode);
    const photoPath = req.file ? req.file.path : null;

    const insertQuery = `
      INSERT INTO students
      (reg_no, first_name, middle_name, last_name, gender, dob, id_number, phone, email, course_id, module, term, guardian_name, guardian_phone, address, photo, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      reg_no,
      first_name,
      middle_name || null,
      last_name,
      gender,
      dob ? moment(dob).format("YYYY-MM-DD") : null,
      id_number || null,
      phone || null,
      email || null,
      course_id,
      module,
      term,
      guardian_name || null,
      guardian_phone || null,
      address || null,
      photoPath || null,
      moment().format("YYYY-MM-DD HH:mm:ss"),
    ];

    const [result] = await db.execute(insertQuery, values);
    const studentId = result.insertId;

    res.status(201).json({ success: true, message: "Student added successfully", id: studentId, reg_no });
  } catch (err) {
    console.error("Add Student Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE student
export const updateStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const body = req.body || {};
    const photoPath = req.file ? req.file.path : null;

    const {
      first_name,
      middle_name,
      last_name,
      gender,
      dob,
      id_number,
      phone,
      email,
      course_id,
      module,
      term,
      guardian_name,
      guardian_phone,
      address,
    } = body;

    // ✅ 1. GET user_id from students
    const [[student]] = await connection.execute(
      "SELECT user_id FROM students WHERE id=?",
      [id]
    );

    if (!student) {
      throw new Error("Student not found");
    }

    const userId = student.user_id;

    // ✅ 2. UPDATE students table
    let query = `
      UPDATE students
      SET first_name=?, middle_name=?, last_name=?, gender=?, dob=?, 
          id_number=?, phone=?, email=?, course_id=?, module=?, term=?, 
          guardian_name=?, guardian_phone=?, address=?, updatedAt=?
    `;

    const values = [
      first_name,
      middle_name || null,
      last_name,
      gender,
      dob || null,
      id_number || null,
      phone || null,
      email || null,
      course_id,
      module,
      term,
      guardian_name || null,
      guardian_phone || null,
      address || null,
      moment().format("YYYY-MM-DD HH:mm:ss"),
    ];

    if (photoPath) {
      query += ", photo=?";
      values.push(photoPath);
    }

    query += " WHERE id=?";
    values.push(id);

    await connection.execute(query, values);

    // ✅ 3. UPDATE users table
    await connection.execute(
      `UPDATE users 
       SET first_name=?, middle_name=?, last_name=?, email=? 
       WHERE id=?`,
      [first_name, middle_name || null, last_name, email, userId]
    );

    await connection.commit();

    res.json({ success: true, message: "Student updated successfully" });

  } catch (err) {
    await connection.rollback();
    console.error("Update Student Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};
// GET all students
export const getStudents = async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT s.*, c.course_code, c.course_name, c.course_id
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      ORDER BY s.createdAt DESC
    `);
    res.json(results);
  } catch (err) {
    console.error("Get Students Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET student by ID
export const getStudentById = async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT s.*, c.course_code, c.course_name
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.id = ?
    `, [req.params.id]);

    if (results.length === 0) return res.status(404).json({ error: "Student not found" });
    res.json(results[0]);
  } catch (err) {
    console.error("Get Student By ID Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE student
export const deleteStudent = async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM students WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ error: err.message });
  }
};
