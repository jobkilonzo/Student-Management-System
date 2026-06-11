import db from "../../database/mysql_database.js";

const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const buildBase = async ({ term, unitId, courseId }) => {
  const where = ["m.term = ?"];
  const params = [term];

  if (unitId) {
    where.push("m.unit_id = ?");
    params.push(unitId);
  }
  if (courseId) {
    where.push("u.course_id = ?");
    params.push(courseId);
  }

  // Absent exclusion (strict): treat ABSENT grade or total=0 as absent/missed
  where.push("(m.grade IS NULL OR UPPER(m.grade) <> 'ABSENT')");
  where.push("(m.total IS NULL OR m.total > 0)");

  return { where, params };
};

/**
 * Retake eligible:
 * - Failed unit (total < pass_marks)
 * - Not ABSENT
 *
 * Note: if pass_marks exists in exam_schedules we use it; fallback 40.
 */
export const listRetakeEligible = async (req, res) => {
  try {
    const term = toInt(req.query.term);
    const unitId = toInt(req.query.unit_id);
    const courseId = toInt(req.query.course_id);

    if (!term) return res.status(400).json({ error: "term is required" });

    const { where, params } = await buildBase({ term, unitId, courseId });

    const [rows] = await db.execute(
      `
      SELECT
        s.id AS student_id,
        s.reg_no,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        m.unit_id,
        u.unit_code,
        u.unit_name,
        u.course_id,
        c.course_code,
        c.course_name,
        m.term,
        m.module,
        m.cat_mark,
        m.exam_mark,
        m.total,
        m.grade,
        COALESCE(es.pass_marks, 40) AS pass_marks
      FROM marks m
      JOIN students s ON s.id = m.student_id
      JOIN units u ON u.unit_id = m.unit_id
      LEFT JOIN courses c ON c.course_id = u.course_id
      LEFT JOIN exam_schedules es
        ON es.unit_id = m.unit_id
       AND es.course_id = u.course_id
       AND (es.module IS NULL OR es.module = m.module)
      WHERE ${where.join(" AND ")}
        AND (m.total IS NULL OR m.total < COALESCE(es.pass_marks, 40))
      ORDER BY c.course_name, u.unit_code, student_name
      `,
      params
    );

    return res.json({ success: true, term, count: rows.length, students: rows });
  } catch (err) {
    console.error("Retake eligibility error:", err);
    return res.status(500).json({ error: "Failed to load retake eligibility" });
  }
};

/**
 * Supplementary eligible:
 * - Same strict ABSENT exclusion
 * - Uses failed-unit rule (until a dedicated supplementary status flag/table exists)
 */
export const listSupplementaryEligible = async (req, res) => {
  // For now, mirror retake rule set. This keeps strict exclusions centralized.
  return listRetakeEligible(req, res);
};

