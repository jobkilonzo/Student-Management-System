// controllers/transcriptController.js
import db from "../../database/mysql_database.js";
import moment from "moment";

// ================================
// Generate Full Transcript for a Student
// ================================
export const generateTranscript = async (req, res) => {
  const { studentId } = req.params;
  const { level, term, levelType } = req.query;

  if (!level || !term) {
    return res.status(400).json({ message: "Level and term are required" });
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
    // 2. Fetch course info with type
    // ================================
    const [courseRows] = await db.execute(
      `SELECT course_name, course_code, course_type FROM courses WHERE course_id = ?`,
      [student.course_id]
    );
    const course = courseRows[0] || {};
    const courseType = course.course_type || "modular";

    // ================================
    // 3. Determine which level column to use based on course type
    // ================================
    let levelColumn = "module"; // default
    switch(courseType) {
      case "modular":
        levelColumn = "module";
        break;
      case "stage_based":
        levelColumn = "stage";
        break;
      case "grade_system":
        levelColumn = "grade";
        break;
      case "level_based":
        levelColumn = "level";
        break;
      default:
        levelColumn = "module";
    }

    // ================================
    // 4. Fetch all units for the specific level
    // ================================
    const [unitsRows] = await db.execute(
      `SELECT unit_id, unit_code, unit_name 
       FROM units 
       WHERE course_id = ? AND ${levelColumn} = ?`,
      [student.course_id, level]
    );

    // ================================
    // 5. Fetch student's marks and attendance for the term
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
    // 6. Merge units & marks, fill ABS for missing
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
    // 7. Calculate overall average & attendance
    // ================================
    const validTotals = marks
      .filter(m => m.total !== "ABS")
      .map(m => parseFloat(m.total));

    const overallAverage = validTotals.length
      ? (validTotals.reduce((a, b) => a + b, 0) / validTotals.length).toFixed(2)
      : null;

    const validAttendances = marks
      .filter(m => m.attendance !== "ABS")
      .map(m => parseFloat(m.attendance));

    const overallAttendance = validAttendances.length > 0
      ? (validAttendances.reduce((a, b) => a + b, 0) / validAttendances.length).toFixed(2)
      : 0;

    // ================================
    // 8. Determine final grade, performance remark & KNEC remark
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

    knecRemark = overallAttendance < 75
      ? "Average attendance below 75% - Not eligible to register for KNEC exam"
      : "Eligible for KNEC exam";

    // ================================
    // 9. Get level display text
    // ================================
    const getLevelDisplayText = () => {
      switch(courseType) {
        case "modular":
          return `Module ${level}`;
        case "stage_based":
          return `Stage ${level}`;
        case "grade_system":
          return `Grade ${level}`;
        case "level_based":
          return `Level ${level}`;
        default:
          return `Module ${level}`;
      }
    };

    // ================================
    // 10. Send response
    // ================================
    res.status(200).json({
      student: {
        name: `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim(),
        regNo: student.reg_no,
        courseId: student.course_id,
        courseName: course.course_name || "-",
        courseCode: course.course_code || "-",
        courseType: courseType,
        level: parseInt(level),
        levelDisplay: getLevelDisplayText(),
        term: parseInt(term),
        overallAttendance: overallAttendance
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

// ================================
// Get available levels for a student based on their course
// ================================
export const getAvailableLevels = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Fetch student with course info
    const [studentRows] = await db.execute(
      `SELECT s.id, s.course_id, c.course_type, c.course_name
       FROM students s
       JOIN courses c ON s.course_id = c.course_id
       WHERE s.id = ?`,
      [studentId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentRows[0];
    const courseType = student.course_type || "modular";

    // Get distinct levels for this course based on course type
    let levelColumn = "module";
    switch(courseType) {
      case "modular":
        levelColumn = "module";
        break;
      case "stage_based":
        levelColumn = "stage";
        break;
      case "grade_system":
        levelColumn = "grade";
        break;
      case "level_based":
        levelColumn = "level";
        break;
      default:
        levelColumn = "module";
    }

    const [levelsRows] = await db.execute(
      `SELECT DISTINCT ${levelColumn} as level_value 
       FROM units 
       WHERE course_id = ? 
       ORDER BY ${levelColumn} ASC`,
      [student.course_id]
    );

    const availableLevels = levelsRows.map(row => ({
      value: row.level_value,
      label: getLevelLabel(courseType, row.level_value)
    }));

    res.status(200).json({
      courseType,
      courseName: student.course_name,
      availableLevels
    });
  } catch (error) {
    console.error("Error fetching available levels:", error);
    res.status(500).json({ message: "Failed to fetch available levels", error: error.message });
  }
};

// ================================
// Get available terms for a specific level
// ================================
export const getAvailableTerms = async (req, res) => {
  const { studentId, level } = req.params;

  try {
    // Fetch student with course info
    const [studentRows] = await db.execute(
      `SELECT s.course_id, c.course_type 
       FROM students s
       JOIN courses c ON s.course_id = c.course_id
       WHERE s.id = ?`,
      [studentId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const courseType = studentRows[0].course_type || "modular";

    // Define term counts based on course type
    const termCount = courseType === "stage_based" ? 2 : 3;
    const availableTerms = [];

    for (let i = 1; i <= termCount; i++) {
      availableTerms.push({
        value: i,
        label: `Term ${i}`
      });
    }

    res.status(200).json({
      courseType,
      availableTerms
    });
  } catch (error) {
    console.error("Error fetching available terms:", error);
    res.status(500).json({ message: "Failed to fetch available terms", error: error.message });
  }
};

// Helper function to get level label
const getLevelLabel = (courseType, levelValue) => {
  switch(courseType) {
    case "modular":
      return `Module ${levelValue}`;
    case "stage_based":
      return `Stage ${levelValue}`;
    case "grade_system":
      return `Grade ${levelValue}`;
    case "level_based":
      return `Level ${levelValue}`;
    default:
      return `Module ${levelValue}`;
  }
};