import db from "../../database/mysql_database.js";
import moment from "moment";
import XLSX from "xlsx";

// BULK IMPORT STUDENTS FROM EXCEL
export const importStudentsExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Excel file is required" });
  }

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
        middle_name,   // Optional
        last_name,
        gender,
        dob,
        id_number,
        phone,
        email,
        course_code,   // Using course_code from Excel
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
        // Get course_id from course_code using your table structure
        const courseQuery = "SELECT course_id FROM courses WHERE course_code = ?";
        const courseResults = await new Promise((resolve, reject) => {
          db.query(courseQuery, [course_code], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (courseResults.length === 0) {
          errors.push({ row, error: `Course code ${course_code} not found` });
          continue;
        }

        const course_id = courseResults[0].course_id;
        const reg_no = await generateRegNo(course_id, course_code);

        const insertQuery = `INSERT INTO students
          (reg_no, first_name, middle_name, last_name, gender, dob, id_number, phone, email, course_id, module, term, guardian_name, guardian_phone, address, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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

        await new Promise((resolve, reject) => {
          db.query(insertQuery, values, (err, result) => {
            if (err) reject(err);
            else {
              successes.push({ reg_no, first_name, middle_name, last_name });
              resolve();
            }
          });
        });
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

// Generate Registration Number using course_code
const generateRegNo = (courseId, courseCode) => {
  return new Promise((resolve, reject) => {
    const year = moment().format("YYYY");

    const countQuery =
      "SELECT COUNT(*) AS total FROM students WHERE course_id=? AND YEAR(createdAt)=?";
    db.query(countQuery, [courseId, year], (err, countResults) => {
      if (err) return reject(err);
      const nextNumber = (countResults[0].total || 0) + 1;
      const formatted = String(nextNumber).padStart(3, "0");
      resolve(`JP/${courseCode}/${year}/${formatted}`);
    });
  });
};

// CREATE student – robust version with multer support
export const addStudent = async (req, res) => {
  try {
    // Handle FormData
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
      course_id,      // This comes from frontend as course_id (the ID value)
      module,
      term,
      guardian_name,
      guardian_phone,
      address,
    } = body;

    // Convert course_id to integer
    course_id = parseInt(course_id);

    // Validate required fields
    if (!first_name || !last_name || !gender || !course_id || !module || !term) {
      return res.status(400).json({
        error: "Missing required fields: first_name, last_name, gender, course_id, module, term are required",
      });
    }

    // Get course_code from courses table using course_id
    const courseQuery = "SELECT course_code FROM courses WHERE course_id = ?";
    const courseResults = await new Promise((resolve, reject) => {
      db.query(courseQuery, [course_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (courseResults.length === 0) {
      return res.status(400).json({ error: "Invalid course_id, course not found" });
    }

    const courseCode = courseResults[0].course_code;
    
    // Generate registration number
    const reg_no = await generateRegNo(course_id, courseCode);

    // Handle optional photo upload
    const photoPath = req.file ? req.file.path : null;

    // Insert into DB
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

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("DB Insert Error:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }

      res.status(201).json({
        success: true,
        message: "Student added successfully",
        id: result.insertId,
        reg_no,
      });
    });
  } catch (err) {
    console.error("Add Student Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// UPDATE student with photo support
export const updateStudent = (req, res) => {
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
  } = req.body;

  const { id } = req.params;
  const photoPath = req.file ? req.file.path : null;

  let query, values;
  
  if (photoPath) {
    query = `
      UPDATE students
      SET first_name=?, middle_name=?, last_name=?, gender=?, dob=?, 
          id_number=?, phone=?, email=?, course_id=?, module=?, term=?, 
          guardian_name=?, guardian_phone=?, address=?, photo=?, updatedAt=?
      WHERE id=?
    `;
    values = [
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
      photoPath,
      moment().format("YYYY-MM-DD HH:mm:ss"),
      id,
    ];
  } else {
    query = `
      UPDATE students
      SET first_name=?, middle_name=?, last_name=?, gender=?, dob=?, 
          id_number=?, phone=?, email=?, course_id=?, module=?, term=?, 
          guardian_name=?, guardian_phone=?, address=?, updatedAt=?
      WHERE id=?
    `;
    values = [
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
      id,
    ];
  }

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
    res.json({ success: true, message: "Student updated successfully" });
  });
};

// GET all students with course details
export const getStudents = (req, res) => {
  const query = `
    SELECT s.*, c.course_code, c.course_name, c.course_id
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.course_id
    ORDER BY s.createdAt DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Failed to fetch students:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    res.json(results);
  });
};

// GET student by ID
export const getStudentById = (req, res) => {
  const query = `
    SELECT s.*, c.course_code, c.course_name
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.course_id
    WHERE s.id = ?
  `;
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Student not found" });
    res.json(results[0]);
  });
};

// DELETE student
export const deleteStudent = (req, res) => {
  const query = "DELETE FROM students WHERE id=?";
  db.query(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Student deleted successfully" });
  });
};