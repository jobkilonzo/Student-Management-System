import db from "../../database/mysql_database.js";
import moment from "moment";

// CREATE UNIT
export const createUnit = async (req, res) => {
  try {
    const { unit_code, unit_name, course_id, module, stage, course_code } = req.body;

    if (!unit_code || !unit_name || !course_id) {
      return res.status(400).json({ message: "unit_code, unit_name, and course_id are required" });
    }

    // Check duplicate in same course
    const [existing] = await db.execute(
      "SELECT unit_id FROM units WHERE unit_code = ? AND course_id = ?",
      [unit_code, course_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Unit with this code already exists for this course" });
    }

    // Fetch course_code if not provided
    let finalCourseCode = course_code;
    if (!finalCourseCode) {
      const [courseRows] = await db.execute("SELECT course_code FROM courses WHERE course_id = ?", [course_id]);
      if (courseRows.length === 0) {
        return res.status(404).json({ message: "Course not found" });
      }
      finalCourseCode = courseRows[0].course_code;
    }

    // Determine course structure type
    const [courseInfo] = await db.execute(
      "SELECT course_name, course_type FROM courses WHERE course_id = ?", 
      [course_id]
    );
    
    let moduleValue = null;
    let stageValue = null;
    
    if (courseInfo.length > 0) {
      const courseName = courseInfo[0].course_name?.toLowerCase() || "";
      const courseType = courseInfo[0].course_type;
      
      // Modular courses (Craft, Modular)
      if (courseType === "modular" || courseName.includes("craft") || courseName.includes("modular")) {
        moduleValue = module || null;
      }
      // Stage/Grade courses (Diploma, Degree, Grade)
      else if (courseType === "stage" || courseName.includes("diploma") || 
               courseName.includes("degree") || courseName.includes("grade") || 
               courseName.includes("stage")) {
        stageValue = stage || null;
      }
      // If both provided, use based on what's available
      else {
        moduleValue = module || null;
        stageValue = stage || null;
      }
    }

    const [result] = await db.execute(
      `INSERT INTO units (unit_code, unit_name, course_id, module, stage, course_code, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [unit_code, unit_name, course_id, moduleValue, stageValue, finalCourseCode, moment().format("YYYY-MM-DD HH:mm:ss")]
    );

    res.status(201).json({
      unit_id: result.insertId,
      unit_code,
      unit_name,
      course_id,
      module: moduleValue,
      stage: stageValue,
      course_code: finalCourseCode,
    });
  } catch (err) {
    console.error("Create Unit Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE UNIT
export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit_code, unit_name, module, stage } = req.body;

    if (!unit_code || !unit_name) {
      return res.status(400).json({ message: "unit_code and unit_name are required" });
    }

    const [currentRows] = await db.execute("SELECT course_id FROM units WHERE unit_id = ?", [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const course_id = currentRows[0].course_id;

    // Check for duplicate unit code in same course
    const [checkRows] = await db.execute(
      "SELECT unit_id FROM units WHERE unit_code = ? AND course_id = ? AND unit_id != ?",
      [unit_code, course_id, id]
    );
    if (checkRows.length > 0) {
      return res.status(409).json({ message: "Another unit with this code exists for this course" });
    }

    // Get course type to determine which field to update
    const [courseInfo] = await db.execute(
      "SELECT course_name, course_type FROM courses WHERE course_id = ?",
      [course_id]
    );
    
    let moduleValue = null;
    let stageValue = null;
    
    if (courseInfo.length > 0) {
      const courseName = courseInfo[0].course_name?.toLowerCase() || "";
      const courseType = courseInfo[0].course_type;
      
      if (courseType === "modular" || courseName.includes("craft") || courseName.includes("modular")) {
        moduleValue = module || null;
      } else if (courseType === "stage" || courseName.includes("diploma") || 
                 courseName.includes("degree") || courseName.includes("grade") || 
                 courseName.includes("stage")) {
        stageValue = stage || null;
      } else {
        moduleValue = module || null;
        stageValue = stage || null;
      }
    }

    await db.execute(
      "UPDATE units SET unit_code = ?, unit_name = ?, module = ?, stage = ? WHERE unit_id = ?",
      [unit_code, unit_name, moduleValue, stageValue, id]
    );

    const [updatedRows] = await db.execute("SELECT * FROM units WHERE unit_id = ?", [id]);
    res.json(updatedRows[0]);
  } catch (err) {
    console.error("Update Unit Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET UNITS BY COURSE
export const getUnitsByCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    
    // Get course type to determine which field to show
    const [courseInfo] = await db.execute(
      "SELECT course_type, course_name FROM courses WHERE course_id = ?",
      [courseId]
    );
    
    let orderByField = "unit_code";
    if (courseInfo.length > 0) {
      const courseName = courseInfo[0].course_name?.toLowerCase() || "";
      const courseType = courseInfo[0].course_type;
      
      if (courseType === "modular" || courseName.includes("craft") || courseName.includes("modular")) {
        orderByField = "module, unit_code";
      } else if (courseType === "stage" || courseName.includes("diploma") || 
                 courseName.includes("degree") || courseName.includes("grade") || 
                 courseName.includes("stage")) {
        orderByField = "stage, unit_code";
      }
    }
    
    const [rows] = await db.execute(
      `SELECT * FROM units WHERE course_id = ? ORDER BY ${orderByField}`,
      [courseId]
    );
    
    res.json(rows || []);
  } catch (err) {
    console.error("Get Units By Course Error:", err);
    res.status(500).json({ message: "Server error", units: [] });
  }
};

// GET UNIT BY ID
export const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute("SELECT * FROM units WHERE unit_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Get Unit By ID Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET ALL UNITS
export const getAllUnits = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM units ORDER BY course_code, COALESCE(stage, module), unit_code"
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Get All Units Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET UNITS WITH COURSE NAME
export const getUnitsWithCourseName = async (req, res) => {
  try {
    const sql = `
      SELECT u.unit_id, u.unit_code, u.unit_name, u.module, u.stage, u.course_id, 
             c.course_name, c.course_type
      FROM units u
      JOIN courses c ON u.course_id = c.course_id
      ORDER BY c.course_name, COALESCE(u.stage, u.module), u.unit_code
    `;
    const [results] = await db.execute(sql);
    res.status(200).json({ units: results });
  } catch (err) {
    console.error("Get Units With Course Name Error:", err);
    res.status(500).json({ message: "Failed to fetch units with course name", error: err.message });
  }
};

// DELETE UNIT
export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute("DELETE FROM units WHERE unit_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.json({ message: "Unit deleted successfully" });
  } catch (err) {
    console.error("Delete Unit Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET UNITS BY MODULE (for modular courses)
export const getUnitsByModule = async (req, res) => {
  try {
    const { courseId, module } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM units WHERE course_id = ? AND module = ? ORDER BY unit_code",
      [courseId, module]
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Get Units By Module Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET UNITS BY STAGE (for stage-based courses)
export const getUnitsByStage = async (req, res) => {
  try {
    const { courseId, stage } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM units WHERE course_id = ? AND stage = ? ORDER BY unit_code",
      [courseId, stage]
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Get Units By Stage Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};