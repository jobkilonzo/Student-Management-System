import db from "../../database/mysql_database.js";
import moment from "moment";
import XLSX from "xlsx";

// -------------------- BULK IMPORT STUDENTS FROM EXCEL --------------------
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
        first_name, middle_name, last_name, gender, dob, id_number,
        phone, email, course_code, module, term,
        guardian_name, guardian_phone, address
      } = row;

      if (!first_name || !last_name || !gender || !course_code || !module || !term) {
        errors.push({ row, error: "Missing required fields" });
        continue;
      }

      try {
        // Get course_id
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
          (reg_no, first_name, middle_name, last_name, gender, dob, id_number,
           phone, email, course_id, module, term, guardian_name, guardian_phone, address, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          reg_no, first_name, middle_name || null, last_name, gender,
          dob ? moment(dob).format("YYYY-MM-DD") : null, id_number || null,
          phone || null, email || null, course_id, module, term,
          guardian_name || null, guardian_phone || null, address || null,
          moment().format("YYYY-MM-DD HH:mm:ss")
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
      errors
    });
  } catch (err) {
    console.error("Excel import error:", err);
    res.status(500).json({ error: err.message });
  }
};

// -------------------- GENERATE REGISTRATION NUMBER --------------------
const generateRegNo = async (courseId, courseCode) => {
  const year = moment().format("YYYY");
  const [countResults] = await db.execute(
    "SELECT COUNT(*) AS total FROM students WHERE course_id=? AND YEAR(createdAt)=?",
    [courseId, year]
  );
  const nextNumber = (countResults[0].total || 0) + 1;
  return `JP/${courseCode}/${year}/${String(nextNumber).padStart(3, "0")}`;
};

// -------------------- ADD SINGLE STUDENT --------------------
export const addStudent = async (req, res) => {
  try {
    const body = req.body || {};
    let {
      first_name, middle_name, last_name, gender, dob,
      id_number, phone, email, course_id, module, term,
      guardian_name, guardian_phone, address
    } = body;

    course_id = parseInt(course_id);
    if (!first_name || !last_name || !gender || !course_id || !module || !term) {
      return res.status(400).json({
        error: "Missing required fields: first_name, last_name, gender, course_id, module, term"
      });
    }

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
      (reg_no, first_name, middle_name, last_name, gender, dob, id_number,
       phone, email, course_id, module, term, guardian_name, guardian_phone, address, photo, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      reg_no, first_name, middle_name || null, last_name, gender,
      dob ? moment(dob).format("YYYY-MM-DD") : null, id_number || null,
      phone || null, email || null, course_id, module, term,
      guardian_name || null, guardian_phone || null, address || null,
      photoPath || null, moment().format("YYYY-MM-DD HH:mm:ss")
    ];

    const [result] = await db.execute(insertQuery, values);
    const studentId = result.insertId;

    res.status(201).json({ success: true, message: "Student added successfully", id: studentId, reg_no });
  } catch (err) {
    console.error("Add Student Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// -------------------- UPDATE STUDENT --------------------
export const updateStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const body = req.body || {};
    const photoPath = req.file ? req.file.path : null;

    const {
      first_name, middle_name, last_name, gender, dob,
      id_number, phone, email, course_id, module, term,
      guardian_name, guardian_phone, address
    } = body;

    // Get current student data
    const [[student]] = await connection.execute(
      "SELECT user_id, course_id, module, term FROM students WHERE id=?",
      [id]
    );

    if (!student) throw new Error("Student not found");

    const userId = student.user_id;
    const currentCourseId = Number(student.course_id);
    const nextCourseId = Number(course_id);
    
    // Convert module and term to numbers
    const currentModule = student.module !== null && student.module !== undefined ? Number(student.module) : null;
    const nextModule = module !== null && module !== undefined && module !== '' ? Number(module) : null;
    const currentTerm = student.term !== null && student.term !== undefined ? Number(student.term) : null;
    const nextTerm = term !== null && term !== undefined && term !== '' ? Number(term) : null;

    // STRICT comparison
    const courseChanged = currentCourseId !== nextCourseId;
    const moduleChanged = currentModule !== nextModule;
    const termChanged = currentTerm !== nextTerm;
    const academicStageChanged = courseChanged || moduleChanged || termChanged;

    // Detailed logging
    console.log("\n=== STUDENT UPDATE DEBUG ===");
    console.log(`Student ID: ${id}`);
    console.log(`Course: ${currentCourseId} → ${nextCourseId} (Changed: ${courseChanged})`);
    console.log(`Module: ${currentModule} → ${nextModule} (Changed: ${moduleChanged})`);
    console.log(`Term: ${currentTerm} → ${nextTerm} (Changed: ${termChanged})`);
    console.log(`Academic Stage Changed: ${academicStageChanged}`);
    console.log("=============================\n");

    const toNull = (value) => {
      return value === undefined || value === '' ? null : value;
    };

    // ------------- STEP 1: Update Student Table -------------
    let query = `UPDATE students SET 
      first_name=?, middle_name=?, last_name=?, gender=?, dob=?,
      id_number=?, phone=?, email=?, course_id=?, module=?, term=?,
      guardian_name=?, guardian_phone=?, address=?, updatedAt=?`;

    const values = [
      toNull(first_name), toNull(middle_name), toNull(last_name), toNull(gender), toNull(dob),
      toNull(id_number), toNull(phone), toNull(email), toNull(nextCourseId), toNull(nextModule), toNull(nextTerm),
      toNull(guardian_name), toNull(guardian_phone), toNull(address), moment().format("YYYY-MM-DD HH:mm:ss")
    ];

    if (photoPath) {
      query += ", photo=?";
      values.push(photoPath);
    }

    query += " WHERE id=?";
    values.push(id);
    await connection.execute(query, values);
    console.log(`✅ Student table updated`);

    // ------------- STEP 2: Update User Table -------------
    if (userId) {
      await connection.execute(
        `UPDATE users SET first_name=?, middle_name=?, last_name=?, email=? WHERE id=?`,
        [toNull(first_name), toNull(middle_name), toNull(last_name), toNull(email), userId]
      );
      console.log(`✅ User table updated`);
    }

    // ------------- STEP 3: Update fee-related tables if academic stage changed -------------
    if (academicStageChanged) {
      console.log(`✅ Academic stage changed! Updating fee-related tables...`);
      
      // Step 3.1: Record Progression
      const [historySnapshotRows] = await connection.execute(
        `SELECT c.course_id, c.course_code, c.course_name,
                COALESCE(SUM(cf.amount),0) AS fee_amount
         FROM courses c
         LEFT JOIN course_fees cf ON c.course_id = cf.course_id AND cf.module = ? AND cf.term = ?
         WHERE c.course_id = ?
         GROUP BY c.course_id`,
        [toNull(currentModule), toNull(currentTerm), currentCourseId]
      );

      const historySnapshot = historySnapshotRows[0];
      if (historySnapshot) {
        await connection.execute(
          `INSERT INTO student_progressions
           (student_id, course_id, course_code, course_name, module, term, fee_amount, changed_by, archived_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            historySnapshot.course_id,
            toNull(historySnapshot.course_code),
            toNull(historySnapshot.course_name),
            toNull(currentModule),
            toNull(currentTerm),
            Number(historySnapshot.fee_amount || 0),
            toNull(req.user?.id),
            moment().format("YYYY-MM-DD HH:mm:ss"),
          ]
        );
        console.log(`✅ Progression recorded`);
      }
      
      // Step 3.2: Update Fee Balances
      try {
        // Get existing balance from student_balances for the OLD course
        const [[oldStudentBalance]] = await connection.execute(
          `SELECT balance, amount_paid FROM student_balances 
           WHERE student_id = ? AND course_id = ?`,
          [id, currentCourseId]
        );
        
        const existingBalance = Number(oldStudentBalance?.balance || 0);
        const existingAmountPaid = Number(oldStudentBalance?.amount_paid || 0);
        
        console.log(`\n💰 Existing balance for old course ${currentCourseId}: ${existingBalance}`);
        
        // Get all fee types from course_fees for the new course, module, and term
        const [courseFees] = await connection.execute(
          `SELECT * FROM course_fees 
           WHERE course_id = ? AND module = ? AND term = ? 
           ORDER BY fee_type_id`,
          [nextCourseId, nextModule, nextTerm]
        );
        
        console.log(`\n📋 Found ${courseFees.length} fee types for Module ${nextModule}, Term ${nextTerm}`);
        
        if (courseFees.length > 0) {
          // Delete existing fee balances for this student's new academic stage
          const deleteResult = await connection.execute(
            `DELETE FROM student_fee_balances 
             WHERE student_id = ? AND course_id = ? AND module = ? AND term = ?`,
            [id, nextCourseId, nextModule, nextTerm]
          );
          console.log(`🗑️ Deleted ${deleteResult[0].affectedRows} existing fee balance records`);
          
          // Insert new fee types from course_fees
          let totalNewFees = 0;
          
          console.log(`\n📝 Inserting new fee types:`);
          for (const fee of courseFees) {
            const amount = Number(fee.amount);
            totalNewFees += amount;
            
            await connection.execute(
              `INSERT INTO student_fee_balances 
               (student_id, course_id, term, fee_type_id, total_fee, amount_paid, balance, module, updated_at)
               VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())`,
              [id, nextCourseId, fee.term, fee.fee_type_id, amount, amount, fee.module]
            );
            console.log(`   ✅ Inserted fee_type_id ${fee.fee_type_id}: ${amount}`);
          }
          
          console.log(`\n💰 Total new fees for Module ${nextModule}, Term ${nextTerm}: ${totalNewFees}`);
          
          // Handle carry-over balance if exists
          if (existingBalance > 0) {
            // First, check if fee_type_id 999 exists in fee_types table
            const [[carryOverFeeType]] = await connection.execute(
              `SELECT id FROM fee_types WHERE id = 999`
            );
            
            if (carryOverFeeType) {
              // Fee type 999 exists, insert as separate row
              const [existingCarryOver] = await connection.execute(
                `SELECT id FROM student_fee_balances 
                 WHERE student_id = ? AND course_id = ? AND term = ? AND fee_type_id = 999 AND module = ?`,
                [id, nextCourseId, nextTerm, nextModule]
              );
              
              if (existingCarryOver.length === 0) {
                await connection.execute(
                  `INSERT INTO student_fee_balances 
                   (student_id, course_id, term, fee_type_id, total_fee, amount_paid, balance, module, updated_at)
                   VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())`,
                  [id, nextCourseId, nextTerm, 999, existingBalance, existingBalance, nextModule]
                );
                console.log(`   ✅ Added carry-over balance as fee_type_id 999: ${existingBalance}`);
              } else {
                await connection.execute(
                  `UPDATE student_fee_balances 
                   SET total_fee = ?, balance = ?, updated_at = NOW()
                   WHERE student_id = ? AND course_id = ? AND term = ? AND fee_type_id = 999 AND module = ?`,
                  [existingBalance, existingBalance, id, nextCourseId, nextTerm, nextModule]
                );
                console.log(`   ✅ Updated carry-over balance as fee_type_id 999: ${existingBalance}`);
              }
            } else {
              console.log(`   ⚠️ Carry-over balance of ${existingBalance} will be added to total but not as separate row (fee_type_id 999 doesn't exist in fee_types)`);
              console.log(`   💡 To add carry-over as separate row, run: INSERT INTO fee_types (id, fee_type_name) VALUES (999, 'Carry Over Balance');`);
            }
          }
          
          // Calculate total fees for student_balances
          const totalFees = totalNewFees + existingBalance;
          
          // Update or insert student_balances
          const [existingSummary] = await connection.execute(
            "SELECT id, amount_paid, last_payment_date FROM student_balances WHERE student_id = ? AND course_id = ?",
            [id, nextCourseId]
          );
          
          if (existingSummary.length > 0) {
            const currentAmountPaid = Number(existingSummary[0].amount_paid || 0);
            
            await connection.execute(
              `UPDATE student_balances 
               SET total_fees = ?, 
                   balance = ?, 
                   updated_at = NOW()
               WHERE student_id = ? AND course_id = ?`,
              [totalFees, totalFees - currentAmountPaid, id, nextCourseId]
            );
            
            console.log(`\n📊 Updated student_balances: total_fees=${totalFees}, balance=${totalFees - currentAmountPaid}`);
          } else {
            await connection.execute(
              `INSERT INTO student_balances 
               (student_id, course_id, total_fees, amount_paid, balance, last_payment_date, updated_at)
               VALUES (?, ?, ?, 0, ?, NULL, NOW())`,
              [id, nextCourseId, totalFees, totalFees]
            );
            
            console.log(`\n📊 Inserted new student_balances: total_fees=${totalFees}, balance=${totalFees}`);
          }
          
          // Log the fee update
          await connection.execute(
            `INSERT INTO audit_logs (user_id, action, target_id, details, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [toNull(req.user?.id), "UPDATE_STUDENT_FEES", id,
             `Fees updated: Course ${currentCourseId}/M${currentModule}/T${currentTerm} → ${nextCourseId}/M${nextModule}/T${nextTerm}. Balance carried: ${existingBalance}, New fees: ${totalNewFees}, Total: ${totalFees}`]
          );
          
          console.log(`\n✅ Fee balances updated successfully`);
        } else {
          console.log(`\n⚠️ WARNING: No course fees found for Module ${nextModule}, Term ${nextTerm}`);
          console.log(`💡 Please check that course_fees table has entries for course_id=${nextCourseId}, module=${nextModule}, term=${nextTerm}`);
        }
      } catch (err) { 
        console.error("❌ Fee update error:", err);
        throw err;
      }
    } else {
      console.log(`❌ No academic stage change. Skipping all fee-related updates.`);
    }

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: "Student updated successfully",
      academic_stage_changed: academicStageChanged,
      fee_tables_updated: academicStageChanged,
      details: {
        course_changed: courseChanged,
        module_changed: moduleChanged,
        term_changed: termChanged
      }
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error("Update Student Error:", err);
    res.status(500).json({ error: err.message });
  }
};
// -------------------- GET ALL STUDENTS --------------------
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

// -------------------- GET STUDENT BY ID --------------------
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

// -------------------- DELETE STUDENT --------------------
export const deleteStudent = async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM students WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ error: err.message });
  }
};
