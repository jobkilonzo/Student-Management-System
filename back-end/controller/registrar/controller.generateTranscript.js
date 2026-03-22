// controllers/transcriptController.js
import db from "../../database/mysql_database.js";
import moment from "moment";

// ================================
// Generate Full Transcript for a Student
// ================================
export const generateTranscript = async (req, res) => {
  const { studentId } = req.params;

  try {
    // ================================
    // 1. Fetch student info
    // ================================
    const [studentRows] = await db.execute(
      `SELECT id, reg_no, first_name, middle_name, last_name, course_id, module, term
       FROM students
       WHERE id = ?`,
      [studentId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentRows[0];

    // ================================
    // 2. Fetch course details
    // ================================
    const [courseRows] = await db.execute(
      `SELECT course_name, course_code 
       FROM courses 
       WHERE course_id = ?`,
      [student.course_id]
    );

    const course = courseRows[0] || {};

    // ================================
    // 3. Fetch marks + units
    // ================================
    const [marksRows] = await db.execute(
      `SELECT 
          u.unit_code, 
          u.unit_name, 
          m.cat_mark, 
          m.exam_mark, 
          m.total, 
          m.grade
       FROM marks m
       JOIN units u ON m.unit_id = u.unit_id
       WHERE m.student_id = ?`,
      [studentId]
    );

    // ================================
    // 4. Calculate average
    // ================================
    let overallAverage = 0;

    if (marksRows.length > 0) {
      const totalSum = marksRows.reduce(
        (sum, m) => sum + parseFloat(m.total || 0),
        0
      );
      overallAverage = totalSum / marksRows.length;
    }

    // ================================
    // 5. Final grade
    // ================================
    let finalGrade = "";

    if (overallAverage >= 80) finalGrade = "A";
    else if (overallAverage >= 70) finalGrade = "B";
    else if (overallAverage >= 60) finalGrade = "C";
    else if (overallAverage >= 50) finalGrade = "D";
    else finalGrade = "F";

    // ================================
    // 6. Remarks
    // ================================
    const remarks =
      overallAverage >= 60 ? "Good Performance" : "Needs Improvement";

    // ================================
    // 7. Response
    // ================================
    res.status(200).json({
      student: {
        name: `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim(),
        regNo: student.reg_no,
        courseId: student.course_id,
        courseName: course.course_name || "-",
        courseCode: course.course_code || "-",
        module: student.module,
        term: student.term,
      },
      marks: marksRows,
      summary: {
        overallAverage: overallAverage.toFixed(2),
        finalGrade,
        remarks,
        totalUnits: marksRows.length,
        generatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      },
    });
  } catch (error) {
    console.error("Transcript Error:", error);
    res.status(500).json({
      message: "Failed to generate transcript",
      error: error.message,
    });
  }
};