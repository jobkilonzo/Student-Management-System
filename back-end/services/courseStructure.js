const normalizeIntOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeBoolOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return null;
};

export const deriveCourseStructure = (courseRow = {}) => {
  const rawName = String(courseRow.course_name || "");
  const name = rawName.toLowerCase();

  const levelTypeRaw = (courseRow.level_type ?? courseRow.levelType ?? "").toString().trim().toLowerCase();
  const levelType =
    levelTypeRaw === "none" || levelTypeRaw === "module" || levelTypeRaw === "stage"
      ? levelTypeRaw
      : null;

  const levelCount = normalizeIntOrNull(courseRow.level_count ?? courseRow.levelCount);
  const termEnabled = normalizeBoolOrNull(courseRow.term_enabled ?? courseRow.termEnabled);
  const termCount = normalizeIntOrNull(courseRow.term_count ?? courseRow.termCount);

  const fallbackLevelType = name.includes("stage") ? "stage" : "module";
  const fallbackLevelCount =
    name.includes("craft") ? 2 : 3;

  const finalLevelType = levelType || fallbackLevelType;
  const finalTermEnabled = termEnabled ?? 1;
  const finalTermCount = termCount ?? 3;

  return {
    level_type: finalLevelType,
    level_count: finalLevelType === "none" ? 0 : (levelCount ?? fallbackLevelCount),
    term_enabled: finalTermEnabled ? 1 : 0,
    term_count: finalTermEnabled ? Math.max(1, finalTermCount) : 1,
    level_label: finalLevelType === "stage" ? "Stage" : finalLevelType === "none" ? "Level" : "Module",
    term_label: "Term",
  };
};

export const safeSelectCourse = async (dbOrConn, courseId) => {
  try {
    const [rows] = await dbOrConn.execute(
      "SELECT course_id, course_code, course_name, level_type, level_count, term_enabled, term_count FROM courses WHERE course_id = ? LIMIT 1",
      [Number(courseId)]
    );
    return rows?.[0] || null;
  } catch (err) {
    if (err?.code !== "ER_BAD_FIELD_ERROR") throw err;
    const [rows] = await dbOrConn.execute(
      "SELECT course_id, course_code, course_name FROM courses WHERE course_id = ? LIMIT 1",
      [Number(courseId)]
    );
    return rows?.[0] || null;
  }
};

export const safeSelectCourses = async (dbOrConn) => {
  try {
    const [rows] = await dbOrConn.execute(
      "SELECT course_id, course_code, course_name, level_type, level_count, term_enabled, term_count FROM courses ORDER BY course_name, course_code"
    );
    return rows || [];
  } catch (err) {
    if (err?.code !== "ER_BAD_FIELD_ERROR") throw err;
    const [rows] = await dbOrConn.execute(
      "SELECT course_id, course_code, course_name FROM courses ORDER BY course_name, course_code"
    );
    return (rows || []).map((r) => ({ ...r, level_type: null, level_count: null, term_enabled: null, term_count: null }));
  }
};

export const safeSelectCourseByCode = async (dbOrConn, courseCode) => {
  const code = String(courseCode || "").trim();
  if (!code) return null;
  try {
    const [rows] = await dbOrConn.execute(
      "SELECT course_id, course_code, course_name, level_type, level_count, term_enabled, term_count FROM courses WHERE course_code = ? LIMIT 1",
      [code]
    );
    return rows?.[0] || null;
  } catch (err) {
    if (err?.code !== "ER_BAD_FIELD_ERROR") throw err;
    const [rows] = await dbOrConn.execute(
      "SELECT course_id, course_code, course_name FROM courses WHERE course_code = ? LIMIT 1",
      [code]
    );
    return rows?.[0] || null;
  }
};
