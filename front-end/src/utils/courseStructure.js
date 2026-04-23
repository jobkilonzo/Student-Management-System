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

export const getCourseStructure = (course = {}) => {
  if (course?.structure && typeof course.structure === "object") {
    return course.structure;
  }

  const name = String(course.course_name || course.name || "").toLowerCase();
  const levelTypeRaw = String(course.level_type ?? course.levelType ?? "").trim().toLowerCase();
  const levelType =
    levelTypeRaw === "none" || levelTypeRaw === "module" || levelTypeRaw === "stage"
      ? levelTypeRaw
      : null;

  const levelCount = normalizeIntOrNull(course.level_count ?? course.levelCount);
  const termEnabled = normalizeBoolOrNull(course.term_enabled ?? course.termEnabled);
  const termCount = normalizeIntOrNull(course.term_count ?? course.termCount);

  const fallbackLevelType = name.includes("stage") ? "stage" : "module";
  const fallbackLevelCount = name.includes("craft") ? 2 : 3;

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

export const formatCourseLevel = (course, value) => {
  const structure = getCourseStructure(course);
  if (value === undefined || value === null || value === "") return "-";
  if (structure.level_type === "none") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${structure.level_label} ${n}`;
};

