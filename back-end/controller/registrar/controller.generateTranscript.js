// controllers/transcriptController.js
import db from "../../database/mysql_database.js";
import moment from "moment";

// ================================
// Generate Full Transcript for a Student
// ================================
export const generateTranscript = async (req, res) => {
  const { studentId } = req.params;
  const { module, term } = req.query;

  if (!module || !term) {
    return res.status(400).json({ message: "Module and term are required" });
  }

  try {
    // ================================
    // 1. Fetch student info
    // ================================
    const [studentRows] = await db.execute(
      `SELECT id, reg_no, first_name, middle_name, last_name, course_id
       FROM students WHERE id = ?`,
      [studentId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }
    const student = studentRows[0];

    // ================================
    // 2. Fetch course info
    // ================================
    const [courseRows] = await db.execute(
      `SELECT course_name, course_code FROM courses WHERE course_id = ?`,
      [student.course_id]
    );
    const course = courseRows[0] || {};

    // ================================
    // 3. Fetch all units for the module
    // ================================
    const [unitsRows] = await db.execute(
      `SELECT unit_id, unit_code, unit_name 
       FROM units 
       WHERE course_id = ? AND module = ?`,
      [student.course_id, module]
    );

    // ================================
    // 4. Fetch student's marks and attendance
    // ================================
    let marksRows = [];
    if (unitsRows.length > 0) {
      const unitIds = unitsRows.map(u => u.unit_id);
      const placeholders = unitIds.map(() => "?").join(",");
      [marksRows] = await db.execute(
        `SELECT unit_id, cat_mark, exam_mark, total, grade, attendance
         FROM marks
         WHERE student_id = ? AND term = ? AND unit_id IN (${placeholders})`,
        [studentId, term, ...unitIds]
      );
    }

    // ================================
    // 5. Merge units & marks, fill ABS for missing
    // ================================
    const marks = unitsRows.map(unit => {
      const mark = marksRows.find(m => m.unit_id === unit.unit_id);
      return {
        unit_code: unit.unit_code,
        unit_name: unit.unit_name,
        cat_mark: mark?.cat_mark != null ? mark.cat_mark : "ABS",
        exam_mark: mark?.exam_mark != null ? mark.exam_mark : "ABS",
        total: mark?.total != null ? mark.total : "ABS",
        grade: mark?.grade || "ABS",
        attendance: mark?.attendance != null ? mark.attendance : "ABS"
      };
    });

    // ================================
    // 6. Calculate overall average & attendance
    // ================================
    const validTotals = marks
      .filter(m => m.total !== "ABS")
      .map(m => parseFloat(m.total));

    const overallAverage = validTotals.length
      ? (validTotals.reduce((a, b) => a + b, 0) / validTotals.length).toFixed(2)
      : null;

    const totalAttendance = marks.reduce(
      (sum, m) => sum + (m.attendance !== "ABS" ? parseFloat(m.attendance) : 0),
      0
    );
    // Calculate overall average & attendance correctly
const validAttendances = marks
  .filter(m => m.attendance !== "ABS")
  .map(m => parseFloat(m.attendance));

const overallAttendance =
  validAttendances.length > 0
    ? validAttendances.reduce((a, b) => a + b, 0) / validAttendances.length
    : 0;



    // ================================
    // 7. Determine final grade, performance remark & KNEC remark
    // ================================
    let finalGrade = "";
    let performanceRemark = "";
    let knecRemark = "";

    if (overallAverage != null) {
      if (overallAverage >= 80) finalGrade = "A";
      else if (overallAverage >= 70) finalGrade = "B";
      else if (overallAverage >= 60) finalGrade = "C";
      else if (overallAverage >= 50) finalGrade = "D";
      else finalGrade = "F";

      performanceRemark = overallAverage >= 60 ? "Good Performance" : "Needs Improvement";
    }

    knecRemark =
      overallAttendance < 75
        ? "Average attendance below 75% - Not eligible to register for KNEC exam"
        : "Eligible for KNEC exam";

    // ================================
    // 8. Send response
    // ================================
    res.status(200).json({
      student: {
        name: `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim(),
        regNo: student.reg_no,
        courseId: student.course_id,
        courseName: course.course_name || "-",
        courseCode: course.course_code || "-",
        module: parseInt(module),
        term: parseInt(term),
        overallAttendance
      },
      marks,
      summary: {
        overallAverage,
        finalGrade,
        performanceRemark,
        knecRemark,
        totalUnits: marks.length,
        generatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      },
    });
  } catch (error) {
    console.error("Transcript Error:", error);
    res.status(500).json({ message: "Failed to generate transcript", error: error.message });
  }
};