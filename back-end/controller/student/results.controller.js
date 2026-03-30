import db from "../../database/mysql_database.js";

// GET results
export const getResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedStage = (req.query.stage || "").trim();

    // Get student using user_id
    const [studentRows] = await db.execute(
      `
        SELECT
          s.id,
          s.course_id,
          s.module,
          s.term,
          c.course_code,
          c.course_name
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.course_id
        WHERE s.user_id = ?
      `,
      [userId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentRows[0];
    const studentId = student.id;

    const [progressionRows] = await db.execute(
      `
        SELECT
          id,
          course_id,
          course_code,
          course_name,
          module,
          term,
          archived_at
        FROM student_progressions
        WHERE student_id = ?
        ORDER BY archived_at DESC, id DESC
      `,
      [studentId]
    );

    const currentStage = {
      key: `current:${student.course_id}:${student.module || ""}:${student.term || ""}`,
      course_id: student.course_id,
      course_code: student.course_code,
      course_name: student.course_name,
      module: student.module || null,
      term: student.term || null,
      is_current: true,
      label: `${student.course_name || "Current Course"}${student.module ? ` • ${student.module}` : ""}${student.term ? ` • ${student.term}` : ""}`,
    };

    const historicalStages = progressionRows.map((row) => ({
      key: `history:${row.id}`,
      history_id: row.id,
      course_id: row.course_id,
      course_code: row.course_code,
      course_name: row.course_name,
      module: row.module || null,
      term: row.term || null,
      is_current: false,
      archived_at: row.archived_at,
      label: `${row.course_name || "Previous Course"}${row.module ? ` • ${row.module}` : ""}${row.term ? ` • ${row.term}` : ""}`,
    }));

    const stages = [currentStage, ...historicalStages];
    const selectedStage = stages.find((stage) => stage.key === requestedStage) || currentStage;

    let query = `
      SELECT 
        m.id,
        m.cat_mark,
        m.exam_mark,
        m.total,
        m.grade,
        m.is_locked,
        m.created_at,
        u.unit_code,
        u.unit_name,
        u.module,
        u.course_code,
        c.course_name
      FROM marks m
      JOIN units u ON m.unit_id = u.unit_id
      LEFT JOIN courses c ON u.course_id = c.course_id
      WHERE m.student_id = ?
        AND u.course_id = ?
    `;
    const params = [studentId, selectedStage.course_id];

    if (selectedStage.module) {
      query += `
        AND (
          u.module IS NULL
          OR u.module = ''
          OR LOWER(REPLACE(REPLACE(TRIM(u.module), 'module', ''), ' ', '')) =
             LOWER(REPLACE(REPLACE(TRIM(?), 'module', ''), ' ', ''))
        )
      `;
      params.push(selectedStage.module);
    }

    query += ` ORDER BY u.unit_code ASC`;

    const [results] = await db.execute(query, params);

    res.status(200).json({
      data: results,
      stages,
      current_stage: currentStage,
      selected_stage: selectedStage,
    });

  } catch (err) {
    console.error("Get Results Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
