// controllers/student/transcript.controller.js
import db from "../../database/mysql_database.js";
import moment from "moment";

// ================================
// Generate Transcript for logged-in Student
// ================================
export const generateStudentTranscript = async (req, res) => {
  const userEmail = req.user.email;
  let { level, term, levelType } = req.query;

  try {
    // ================================
    // 1. Fetch student info from email
    // ================================
    const [studentRows] = await db.execute(
      `SELECT id, reg_no, first_name, middle_name, last_name, course_id, module, term as student_term
       FROM students WHERE email = ?`,
      [userEmail]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentRows[0];
    const studentId = student.id;
    term = term ?? student.student_term;
    level = level ?? student.module;

    if (!term) {
      return res.status(400).json({ message: "Term is required" });
    }

    // ================================
    // 2. Fetch course info with type
    // ================================
    const [courseRows] = await db.execute(
      `SELECT course_name, course_code, course_type
       FROM courses
       WHERE course_id = ?`,
      [student.course_id]
    );

    const course = courseRows[0] || {};
    const courseType = course.course_type || "modular";
    const isNonModular = courseType === "non_modular";

    if (!isNonModular && !level) {
      return res.status(400).json({ message: "Level is required for this course type" });
    }

    // ================================
    // 3. Determine level column
    // ================================
    let levelColumn = "module";

    switch (courseType) {
      case "modular":
        levelColumn = "module";
        break;
      case "stage_based":
        levelColumn = "stage";
        break;
      case "grade_based":
        levelColumn = "stage";
        break;
      case "level_based":
        levelColumn = "stage";
        break;
      default:
        levelColumn = "module";
    }

    // ================================
    // 4. Fetch units for level
    // ================================
    const [unitsRows] = isNonModular
      ? await db.execute(
          `SELECT unit_id, unit_code, unit_name
           FROM units
           WHERE course_id = ?`,
          [student.course_id]
        )
      : await db.execute(
          `SELECT unit_id, unit_code, unit_name
           FROM units
           WHERE course_id = ?
           AND ${levelColumn} = ?`,
          [student.course_id, level]
        );

    // ================================
    // 5. Fetch marks for this student
    // ================================
    let marksRows = [];

    if (unitsRows.length > 0) {
      const unitIds = unitsRows.map((u) => u.unit_id);
      const placeholders = unitIds.map(() => "?").join(",");

      [marksRows] = await db.execute(
        `SELECT unit_id, cat_mark, exam_mark, total, grade, attendance
         FROM marks
         WHERE student_id = ?
         AND term = ?
         AND unit_id IN (${placeholders})`,
        [studentId, term, ...unitIds]
      );
    }

    // ================================
    // 6. Merge units & marks
    // ================================
    const marks = unitsRows.map((unit) => {
      const mark = marksRows.find((m) => m.unit_id === unit.unit_id);

      return {
        unit_code: unit.unit_code,
        unit_name: unit.unit_name,
        cat_mark:
          mark?.cat_mark !== null && mark?.cat_mark !== undefined
            ? mark.cat_mark
            : "ABSENT",

        exam_mark:
          mark?.exam_mark !== null && mark?.exam_mark !== undefined
            ? mark.exam_mark
            : "ABSENT",

        total:
          mark?.total !== null && mark?.total !== undefined
            ? mark.total
            : "ABSENT",

        grade: mark?.grade || "ABSENT",

        attendance:
          mark?.attendance !== null && mark?.attendance !== undefined
            ? mark.attendance
            : "ABSENT",
      };
    });

    // ================================
    // 7. Calculate averages
    // ================================
    const validTotals = marks
      .filter((m) => m.total !== "ABSENT")
      .map((m) => parseFloat(m.total));

    const overallAverage =
      validTotals.length > 0
        ? (
            validTotals.reduce((a, b) => a + b, 0) /
            validTotals.length
          ).toFixed(2)
        : null;

    const validAttendances = marks
      .filter((m) => m.attendance !== "ABSENT")
      .map((m) => parseFloat(m.attendance));

    const overallAttendance =
      validAttendances.length > 0
        ? (
            validAttendances.reduce((a, b) => a + b, 0) /
            validAttendances.length
          ).toFixed(2)
        : 0;

    // ================================
    // 8. Final grade & remarks
    // ================================
    let finalGrade = "";
    let performanceRemark = "";
    let knecRemark = "";

    // If even one unit has ABS => CRNM
    const hasAbs = marks.some(
      (m) =>
        m.grade === "ABSENT" ||
        m.total === "ABSENT" ||
        m.cat_mark === "ABSENT" ||
        m.exam_mark === "ABSENT"
    );

    const hasRefer = marks.some(
      (m) =>
        typeof m.grade === "string" &&
        m.grade.trim().toUpperCase().startsWith("REFER")
    );

    if (hasAbs) {
      finalGrade = "CRNM";
      performanceRemark = "Candidate Has Missing Marks";
    } else if (hasRefer) {
      finalGrade = "REFERRED";
      performanceRemark = "Candidate has one or more referred units";
    } else if (overallAverage !== null) {
      const avg = parseFloat(overallAverage);

      if (avg >= 90) {
        finalGrade = "DISTINCTION 1";
      } else if (avg >= 80) {
        finalGrade = "DISTINCTION 2";
      } else if (avg >= 70) {
        finalGrade = "CREDIT 3";
      } else if (avg >= 60) {
        finalGrade = "CREDIT 4";
      } else if (avg >= 50) {
        finalGrade = "PASS 5";
      } else if (avg >= 40) {
        finalGrade = "PASS 6";
      } else {
        finalGrade = "REFERRED";
      }

      performanceRemark =
        avg >= 60
          ? "Good Performance"
          : "Needs Improvement";
    } else {
      finalGrade = "CRNM";
      performanceRemark = "No Marks Available";
    }

    // ================================
    // 9. KNEC remark
    // ================================
    knecRemark =
      overallAttendance < 75
        ? "Average attendance below 75% - Not eligible to register for KNEC exam"
        : "Eligible for KNEC exam";

    // ================================
    // 10. Level display text
    // ================================
    const getLevelDisplayText = () => {
      if (isNonModular) return "All Levels";
      switch (courseType) {
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
    // 11. Response
    // ================================
    res.status(200).json({
      student: {
        name:
          `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim(),

        regNo: student.reg_no,
        courseId: student.course_id,
        courseName: course.course_name || "-",
        courseCode: course.course_code || "-",
        courseType,
        level: isNonModular ? null : parseInt(level),
        levelDisplay: getLevelDisplayText(),
        term: parseInt(term),
        overallAttendance,
      },

      marks,

      summary: {
        overallAverage,
        finalGrade,
        remarks: performanceRemark,
        knecRemark,
        totalUnits: marks.length,
        generatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      },
    });
  } catch (error) {
    console.error("Student Transcript Error:", error);

    res.status(500).json({
      message: "Failed to generate transcript",
      error: error.message,
    });
  }
};

// ================================
// Get available levels for student
// ================================
export const getAvailableLevels = async (req, res) => {
  const userEmail = req.user.email;

  try {
    const [studentRows] = await db.execute(
      `SELECT s.id, s.course_id, c.course_type, c.course_name
       FROM students s
       JOIN courses c ON s.course_id = c.course_id
       WHERE s.email = ?`,
      [userEmail]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentRows[0];
    const courseType = student.course_type || "modular";

    let levelColumn = "module";

    switch (courseType) {
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
      `SELECT DISTINCT ${levelColumn} AS level_value
       FROM units
       WHERE course_id = ?
       ORDER BY ${levelColumn} ASC`,
      [student.course_id]
    );

    const availableLevels = levelsRows.map((row) => ({
      value: row.level_value,
      label: getLevelLabel(courseType, row.level_value),
    }));

    res.status(200).json({
      courseType,
      courseName: student.course_name,
      availableLevels,
    });
  } catch (error) {
    console.error("Error fetching available levels:", error);

    res.status(500).json({
      message: "Failed to fetch available levels",
      error: error.message,
    });
  }
};

// ================================
// Get available terms for student
// ================================
export const getAvailableTerms = async (req, res) => {
  const userEmail = req.user.email;
  const { level } = req.params;

  try {
    const [studentRows] = await db.execute(
      `SELECT s.course_id, c.course_type
       FROM students s
       JOIN courses c ON s.course_id = c.course_id
       WHERE s.email = ?`,
      [userEmail]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const courseType = studentRows[0].course_type || "modular";

    const termCount = courseType === "stage_based" ? 2 : 3;

    const availableTerms = [];

    for (let i = 1; i <= termCount; i++) {
      availableTerms.push({
        value: i,
        label: `Term ${i}`,
      });
    }

    res.status(200).json({
      courseType,
      availableTerms,
    });
  } catch (error) {
    console.error("Error fetching available terms:", error);

    res.status(500).json({
      message: "Failed to fetch available terms",
      error: error.message,
    });
  }
};

// Helper function
const getLevelLabel = (courseType, levelValue) => {
  if (!courseType) return `Level ${levelValue}`;
  const typeMap = {
    modular: `Module ${levelValue}`,
    stage_based: `Stage ${levelValue}`,
    grade_system: `Grade ${levelValue}`,
    level_based: `Level ${levelValue}`,
  };
  return typeMap[courseType] || `Level ${levelValue}`;
};
