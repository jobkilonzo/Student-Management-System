import { useState, useEffect, useRef } from "react";
import { makeRequest } from "../../../axios";
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const GenerateTranscript = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableTerms, setAvailableTerms] = useState([]);
  const [selectedCourseType, setSelectedCourseType] = useState(null);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const transcriptRef = useRef();

  // Term mapping based on course type and level
  const termMapping = {
    modular: {
      1: [1, 2, 3],
      2: [1, 2, 3],
      3: [1, 2, 3]
    },
    stage_based: {
      1: [1, 2],
      2: [1, 2],
      3: [1, 2]
    },
    grade_system: {
      1: [1, 2, 3],
      2: [1, 2, 3],
      3: [1, 2, 3]
    },
    level_based: {
      1: [1, 2, 3],
      2: [1, 2, 3],
      3: [1, 2, 3]
    }
  };

  // Fetch students and courses
  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await makeRequest.get("/registrar/students");
      const studentsList = Array.isArray(res.data) ? res.data : [];
      studentsList.sort((a, b) => {
        const nameA = [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ").trim().toLowerCase();
        const nameB = [b.first_name, b.middle_name, b.last_name].filter(Boolean).join(" ").trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setStudents(studentsList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await makeRequest.get("/registrar/courses/");
      setCourses(res.data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
      toast.error("Failed to load courses");
    }
  };

  // Get course details
  const normalizeCourseType = (type) => {
    if (!type) return null;
    const cleaned = String(type)
      .trim()
      .toLowerCase()
      // Some backends store values like "Grade Based, BT" or "Level Based, HD"
      .split(",")[0]
      .trim();

    const normalized = cleaned.replace(/-/g, "_").replace(/\s+/g, "_");

    if (normalized === "nonmodular" || normalized === "non_modular") return "non_modular";
    if (normalized === "gradebased" || normalized === "grade_based") return "grade_system";
    if (normalized === "levelbased" || normalized === "level_based") return "level_based";
    if (normalized === "stagebased" || normalized === "stage_based") return "stage_based";
    if (normalized === "modularbased") return "modular";

    return normalized;
  };

  const coerceNumericLevel = (value) => {
    if (value == null) return null;
    const str = String(value).trim();
    const match = str.match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  const getStudentAcademicLevel = (student) => {
    if (!student) return "";

    const studentCourseId = student.course_id || student.courseId || student.course?.course_id || student.course?.id;
    const courseData = courses.find((c) => String(c.course_id) === String(studentCourseId));
    const courseType = normalizeCourseType(
      courseData?.course_type || student.course_type || student.courseType || student.course?.course_type || student.course?.type || "modular"
    );
    const module = student.module || student.module === 0 ? String(student.module) : "";
    const term = student.term || student.term === 0 ? String(student.term) : "";

    if (courseType === "non_modular") {
      return term ? `Term ${term}` : "";
    }

    if (!module && !term) return "";

    switch (courseType) {
      case "modular":
        return module ? `Module ${module}${term ? ` · Term ${term}` : ""}` : (term ? `Term ${term}` : "");
      case "stage_based":
        return module ? `Stage ${module}${term ? ` · Term ${term}` : ""}` : (term ? `Term ${term}` : "");
      case "grade_system":
        return module ? `Grade ${module}${term ? ` · Term ${term}` : ""}` : (term ? `Term ${term}` : "");
      case "level_based":
        return module ? `Level ${module}${term ? ` · Term ${term}` : ""}` : (term ? `Term ${term}` : "");
      default:
        return module ? `Module ${module}${term ? ` · Term ${term}` : ""}` : (term ? `Term ${term}` : "");
    }
  };

  // Get available levels based on course type
  const getAvailableLevels = (courseType, courseName) => {
    if (!courseType || courseType === "non_modular") return [];
    
    // Special case for Craft courses (only 2 modules)
    if (courseName?.toLowerCase().includes("craft") && courseType === "modular") {
      const levels = [];
      for(let i = 1; i <= 2; i++) {
        levels.push({ value: i, label: `Module ${i}` });
      }
      return levels;
    }
    
    // For modular courses: 3 modules
    if (courseType === "modular") {
      const levels = [];
      for(let i = 1; i <= 3; i++) {
        levels.push({ value: i, label: `Module ${i}` });
      }
      return levels;
    }
    
    // For other course types
    const levels = [];
    for(let i = 1; i <= 3; i++) {
      switch(courseType) {
        case "stage_based":
          levels.push({ value: i, label: `Stage ${i}` });
          break;
        case "grade_system":
          levels.push({ value: i, label: `Grade ${i}` });
          break;
        case "level_based":
          levels.push({ value: i, label: `Level ${i}` });
          break;
        default:
          return [];
      }
    }
    return levels;
  };

  // Get available terms based on course type and level
  const getAvailableTerms = (courseType, levelValue, courseName) => {
    if (!courseType) return [];

    // Non-modular courses: allow term selection without level
    if (courseType === "non_modular") return [1, 2, 3];

    if (!levelValue) return [];
    
    // Special case for Craft courses
    if (courseName?.toLowerCase().includes("craft") && courseType === "modular") {
      return termMapping.modular[levelValue] || [];
    }
    
    return termMapping[courseType]?.[levelValue] || [];
  };

  // Get level label based on course type
  const getLevelLabel = () => {
    if (!selectedCourseType) return "Select Level";
    switch(selectedCourseType) {
      case "modular":
        return selectedCourseName?.toLowerCase().includes("craft") ? "Select Module" : "Select Module";
      case "stage_based":
        return "Select Stage";
      case "grade_system":
        return "Select Grade";
      case "level_based":
        return "Select Level";
      default:
        return "Select Level";
    }
  };

  // Handle student change: use student's course info from backend
  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    setSelectedLevel("");
    setSelectedTerm("");
    setAvailableLevels([]);
    setAvailableTerms([]);

    if (!studentId) {
      setSelectedCourseType(null);
      setSelectedCourseName("");
      return;
    }

    const student = students.find((s) => String(s.id) === String(studentId));
    // Determine course info: prefer course_id -> find in `courses` fetched earlier
    const courseId = student?.course_id || student?.courseId || student?.course?.course_id || student?.course?.id;
    let courseType = null;
    let courseName = "";

    if (courseId) {
      const c = courses.find((x) => String(x.course_id) === String(courseId));
      if (c) {
        courseType = c.course_type || c.level_type || c.courseType || c.type || null;
        courseName = c.course_name || c.name || "";
      }
    }

    // Fallbacks if course_id wasn't available or course list did not include the course
    if (!courseType) {
      courseType = student?.course_type || student?.courseType || student?.course?.course_type || student?.course?.type || "modular";
    }
    if (!courseName) {
      courseName = student?.course_name || student?.courseName || student?.course?.course_name || student?.course?.name || "";
    }

    const normalizedCourseType = normalizeCourseType(courseType);
    setSelectedCourseType(normalizedCourseType || "modular");
    setSelectedCourseName(courseName || "");

    if (normalizedCourseType) {
      const levels = getAvailableLevels(normalizedCourseType, courseName);
      setAvailableLevels(levels);

      const studentLevel = student?.module || student?.level || "";
      const studentTerm = student?.term || "";

      if (normalizedCourseType === "non_modular") {
        setAvailableTerms(getAvailableTerms(normalizedCourseType, null, courseName));
        if (studentTerm) setSelectedTerm(String(studentTerm));
      } else {
        const coercedLevel = coerceNumericLevel(studentLevel);
        if (coercedLevel) {
          setSelectedLevel(String(coercedLevel));
          const terms = getAvailableTerms(normalizedCourseType, coercedLevel, courseName);
          setAvailableTerms(terms);
          const coercedTerm = coerceNumericLevel(studentTerm);
          if (coercedTerm && terms.includes(coercedTerm)) {
            setSelectedTerm(String(coercedTerm));
          }
        }
      }
    }
  };

  // Handle level change
  const handleLevelChange = (e) => {
    const levelValue = e.target.value;
    setSelectedLevel(levelValue);
    setSelectedTerm("");
    
    if (levelValue && selectedCourseType) {
      const terms = getAvailableTerms(selectedCourseType, parseInt(levelValue), selectedCourseName);
      setAvailableTerms(terms);
    } else {
      setAvailableTerms([]);
    }
  };

  const buildTranscriptQuery = (courseType, levelValue, termValue) => {
    const params = new URLSearchParams();
    if (termValue) params.set("term", String(termValue));

    if (courseType === "non_modular") {
      return params.toString();
    }

    if (levelValue) {
      // Keep the legacy `level` param, plus add a course-type-specific alias.
      // Some backends store/access academic progression as module/stage/grade/level.
      params.set("level", String(levelValue));
      switch (courseType) {
        case "modular":
          params.set("module", String(levelValue));
          break;
        case "stage_based":
          params.set("stage", String(levelValue));
          break;
        case "grade_system":
          params.set("grade", String(levelValue));
          break;
        case "level_based":
          params.set("academic_level", String(levelValue));
          break;
        default:
          break;
      }
    }

    return params.toString();
  };

  const hasMarks = (data) => {
    const marks = data?.marks;
    return Array.isArray(marks) && marks.length > 0;
  };

  const fetchTranscriptWithFallbacks = async (studentId, courseType, levelValue, termValue) => {
    const queries = [];

    // Primary: term + level + aliases
    queries.push(buildTranscriptQuery(courseType, levelValue, termValue));

    // Fallbacks: term + alias only, term + level only, and no query at all (some endpoints return latest/overall)
    if (courseType !== "non_modular" && levelValue) {
      const aliasOnly = new URLSearchParams();
      if (termValue) aliasOnly.set("term", String(termValue));
      switch (courseType) {
        case "modular":
          aliasOnly.set("module", String(levelValue));
          break;
        case "stage_based":
          aliasOnly.set("stage", String(levelValue));
          break;
        case "grade_system":
          aliasOnly.set("grade", String(levelValue));
          break;
        case "level_based":
          aliasOnly.set("academic_level", String(levelValue));
          break;
        default:
          break;
      }
      queries.push(aliasOnly.toString());

      const levelOnly = new URLSearchParams();
      if (termValue) levelOnly.set("term", String(termValue));
      levelOnly.set("level", String(levelValue));
      queries.push(levelOnly.toString());
    }

    // Only try no-query for non-modular programs (some backends return "latest" there)
    if (courseType === "non_modular") {
      queries.push("");
    }

    const seen = new Set();
    let lastNonFatalError = null;
    for (const q of queries) {
      const query = String(q || "");
      if (seen.has(query)) continue;
      seen.add(query);

      const url = query
        ? `/registrar/transcript/transcript/${studentId}?${query}`
        : `/registrar/transcript/transcript/${studentId}`;

      try {
        const res = await makeRequest.get(url);
        if (hasMarks(res.data)) {
          return { data: res.data, usedQuery: query };
        }
      } catch (err) {
        // If backend rejects a particular query format, try the next fallback.
        // Keep the last error so we can surface it if all attempts fail.
        lastNonFatalError = err;
        const status = err?.response?.status;
        if (status === 400 || status === 404) continue;
        throw err;
      }
    }

    // If we reach here, all attempts returned empty marks (or were rejected by backend).
    if (lastNonFatalError) {
      throw lastNonFatalError;
    }
    return { data: { marks: [] }, usedQuery: "" };
  };

  // Generate transcript
  const handleGenerate = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (!selectedCourseType) {
      toast.error("Unable to determine course type for this student");
      return;
    }

    const requiresLevel = selectedCourseType !== "non_modular";
    if (requiresLevel && !selectedLevel) {
      toast.error("Please select student, level, and term");
      return;
    }

    if (!selectedTerm) {
      toast.error("Please select term");
      return;
    }

    setLoading(true);
    try {
      const { data, usedQuery } = await fetchTranscriptWithFallbacks(
        selectedStudent,
        selectedCourseType,
        selectedLevel,
        selectedTerm
      );

      // Insert ABS for units with missing marks
      data.marks = (Array.isArray(data.marks) ? data.marks : []).map((m) => ({
        ...m,
        cat_mark: m.cat_mark != null ? m.cat_mark : "ABS",
        exam_mark: m.exam_mark != null ? m.exam_mark : "ABS",
        total: m.total != null ? m.total : "ABS",
        grade: m.grade != null ? m.grade : "ABS",
      }));

      setTranscript(data);
      if (data.marks.length === 0) {
        toast.error("No marks found for the selected level/term.");
        if (usedQuery) {
          console.warn("Transcript query returned no marks:", usedQuery);
        } else {
          console.warn("Transcript query returned no marks (no query params).");
        }
      } else {
        toast.success("Transcript generated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate transcript");
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = () => {
    if (!transcript) return;
    const element = transcriptRef.current;
    element.style.backgroundColor = "#ffffff";
    element.style.backgroundImage = "none";
    element.style.width = "190mm";
    element.style.minHeight = "277mm";

    const name = transcript.student.name || displayName();
    const fileName = name ? `${name.replace(/\s+/g, '_')}_transcript.pdf` : "student_transcript.pdf";

    html2pdf()
      .from(element)
      .set({
        margin: [10, 10, 10, 10],
        filename: fileName,
        html2canvas: {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            // Remove external stylesheets and existing <style> blocks to avoid parsing unsupported color functions (eg. oklch)
            try {
              clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());
            } catch {
              // ignore
            }

            const style = clonedDoc.createElement("style");
            style.setAttribute("data-pdf-safe-colors", "true");
            style.textContent = `
              @page { size: A4; margin: 10mm; }
              html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
              *, *::before, *::after { box-sizing: border-box !important; }

              .pdf-a4 {
                width: 190mm !important;
                min-height: 277mm !important;
                margin: 0 auto !important;
                padding: 8mm !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
              }

              .pdf-a4, .pdf-a4 * {
                background-image: none !important;
                background: transparent !important;
                color: #0f172a !important;
              }

              .pdf-a4 h1, .pdf-a4 h2, .pdf-a4 h3, .pdf-a4 p, .pdf-a4 li, .pdf-a4 td, .pdf-a4 th {
                margin: 0 !important;
                padding: 0 !important;
              }

              .pdf-a4 p, .pdf-a4 td, .pdf-a4 th {
                line-height: 1.5 !important;
              }

              .pdf-a4 table {
                width: 100% !important;
                border-collapse: collapse !important;
                border-spacing: 0 !important;
              }

              .pdf-a4 th, .pdf-a4 td {
                padding: 10px 12px !important;
                border: 1px solid #e2e8f0 !important;
                vertical-align: middle !important;
              }

              .pdf-a4 thead tr {
                background: #e0f2fe !important;
              }

              .pdf-a4 .text-center { text-align: center !important; }
              .pdf-a4 .text-left { text-align: left !important; }
              .pdf-a4 .mb-6 { margin-bottom: 10px !important; }
              .pdf-a4 .mt-4 { margin-top: 8px !important; }
              .pdf-a4 .mt-5 { margin-top: 10px !important; }
              .pdf-a4 .mt-6 { margin-top: 12px !important; }
              .pdf-a4 .mt-8 { margin-top: 16px !important; }
              .pdf-a4 .mb-6 { margin-bottom: 8px !important; }
              .pdf-a4 .p-4 { padding: 8px !important; }
              .pdf-a4 .p-5 { padding: 10px !important; }
              .pdf-a4 .p-8 { padding: 18px !important; }
              .pdf-a4 .rounded-xl { border-radius: 16px !important; }
              .pdf-a4 .rounded-[28px] { border-radius: 28px !important; }
              .pdf-a4 .shadow-lg { box-shadow: none !important; }
              .pdf-a4 .bg-white { background-color: #ffffff !important; }
              .pdf-a4 .bg-sky-50 { background-color: #f0f9ff !important; }
              .pdf-a4 .bg-sky-100 { background-color: #e0f2fe !important; }
              .pdf-a4 .bg-cyan-50 { background-color: #ecfeff !important; }
              .pdf-a4 .bg-slate-50 { background-color: #f8fafc !important; }
              .pdf-a4 .border-sky-100 { border-color: #e0f2fe !important; }
              .pdf-a4 .border-sky-200 { border-color: #bae6fd !important; }
              .pdf-a4 .border-slate-200 { border-color: #e2e8f0 !important; }
              .pdf-a4 .rounded-full { border-radius: 9999px !important; }
              .pdf-a4 .uppercase { text-transform: uppercase !important; }
              .pdf-a4 .font-semibold { font-weight: 600 !important; }
              .pdf-a4 .font-bold { font-weight: 700 !important; }
              .pdf-a4 .tracking-[0.25em] { letter-spacing: 0.25em !important; }
              .pdf-a4 .shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] { box-shadow: none !important; }

              /* Ensure flex utilities work in cloned doc and signatures row is tight */
              .pdf-a4 .flex { display: flex !important; }
              .pdf-a4 .justify-between { justify-content: space-between !important; }
              .pdf-a4 .transcript-signatures { display: flex !important; gap: 12px !important; }
              .pdf-a4 .transcript-signatures > div { flex: 1 1 0 !important; text-align: center !important; }
              .pdf-a4 .transcript-signatures p { font-size: 14px !important; margin: 0 0 6px 0 !important; }
            `;
            clonedDoc.head.appendChild(style);
          },
        },
        pagebreak: { mode: ["css", "legacy"], avoid: ["tr", "img"] },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save()
      .then(() => {
        toast.success("PDF downloaded successfully!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to download PDF");
      })
      .finally(() => {
        element.style.backgroundColor = "";
        element.style.backgroundImage = "";
        element.style.width = "";
        element.style.minHeight = "";
      });
  };

  const printWindowStyles = `
    @page { size: A4; margin: 10mm; }
    html, body {
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      padding: 0;
    }
    .pdf-a4 {
      width: 190mm;
      min-height: 277mm;
      margin: 0 auto;
      padding: 8mm;
      border-radius: 0;
      box-shadow: none;
      background: #ffffff;
      color: #0f172a;
      font-size: 12px;
      line-height: 1.2;
    }
    .pdf-a4, .pdf-a4 * {
      background-image: none !important;
      background: transparent !important;
      color: #0f172a !important;
      box-shadow: none !important;
    }
    .pdf-a4 h1, .pdf-a4 h2, .pdf-a4 h3, .pdf-a4 p, .pdf-a4 li, .pdf-a4 td, .pdf-a4 th {
      margin: 0 !important;
      padding: 0 !important;
    }
    .pdf-a4 p, .pdf-a4 td, .pdf-a4 th {
      line-height: 1.4 !important;
    }
    .pdf-a4 table {
      width: 100% !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
    }
    .pdf-a4 th, .pdf-a4 td {
      padding: 8px 10px !important;
      border: 1px solid #e2e8f0 !important;
      vertical-align: middle !important;
    }
    .pdf-a4 thead tr {
      background: #e0f2fe !important;
    }
    .pdf-a4 .text-center { text-align: center !important; }
    .pdf-a4 .text-left { text-align: left !important; }
    .pdf-a4 .mb-6 { margin-bottom: 10px !important; }
    .pdf-a4 .mt-4 { margin-top: 8px !important; }
    .pdf-a4 .mt-5 { margin-top: 10px !important; }
    .pdf-a4 .mt-6 { margin-top: 12px !important; }
    .pdf-a4 .mt-8 { margin-top: 16px !important; }
    .pdf-a4 .p-4 { padding: 8px !important; }
    .pdf-a4 .p-5 { padding: 10px !important; }
    .pdf-a4 .p-8 { padding: 18px !important; }
    .pdf-a4 .rounded-xl { border-radius: 0 !important; }
    .pdf-a4 .rounded-[28px] { border-radius: 0 !important; }
    .pdf-a4 .shadow-lg { box-shadow: none !important; }
    .pdf-a4 .bg-white { background-color: #ffffff !important; }
    .pdf-a4 .bg-sky-50 { background-color: #f0f9ff !important; }
    .pdf-a4 .bg-sky-100 { background-color: #e0f2fe !important; }
    .pdf-a4 .bg-cyan-50 { background-color: #ecfeff !important; }
    .pdf-a4 .bg-slate-50 { background-color: #f8fafc !important; }
    .pdf-a4 .border-sky-100 { border-color: #e0f2fe !important; }
    .pdf-a4 .border-sky-200 { border-color: #bae6fd !important; }
    .pdf-a4 .border-slate-200 { border-color: #e2e8f0 !important; }
    .pdf-a4 .rounded-full { border-radius: 9999px !important; }
    .pdf-a4 .uppercase { text-transform: uppercase !important; }
    .pdf-a4 .font-semibold { font-weight: 600 !important; }
    .pdf-a4 .font-bold { font-weight: 700 !important; }
    .pdf-a4 .tracking-[0.25em] { letter-spacing: 0.25em !important; }
    .pdf-a4 .flex { display: flex !important; }
    .pdf-a4 .justify-between { justify-content: space-between !important; }
    .pdf-a4 .transcript-signatures { display: flex !important; gap: 12px !important; }
    .pdf-a4 .transcript-signatures > div { flex: 1 1 0 !important; text-align: center !important; }
    .pdf-a4 .transcript-signatures p { font-size: 14px !important; margin: 0 0 6px 0 !important; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; }
      .pdf-a4 { page-break-inside: avoid !important; }
    }
  `;

  const handlePrint = () => {
    if (!transcript) return;

    const element = transcriptRef.current;
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      toast.error("Unable to open print preview. Please allow popups for this site.");
      return;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Student Transcript</title><style>${printWindowStyles}</style></head><body>${element.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();

    const printAndClose = () => {
      printWindow.print();
    };

    if (printWindow.document.readyState === "complete") {
      printAndClose();
    } else {
      printWindow.onload = printAndClose;
    }
  };

  const displayName = () => {
    const s = transcript?.student;
    if (!s) return "";
    return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") || s.name || "Unknown Student";
  };

  const getLevelDisplayText = () => {
    if (!selectedLevel || !selectedCourseType) return "";
    if (selectedCourseType === "non_modular") return "";
    switch(selectedCourseType) {
      case "modular":
        return `Module ${selectedLevel}`;
      case "stage_based":
        return `Stage ${selectedLevel}`;
      case "grade_system":
        return `Grade ${selectedLevel}`;
      case "level_based":
        return `Level ${selectedLevel}`;
      default:
        return "";
    }
  };

  // Prepare students list: filter by name search and course selection
  const displayedStudents = (Array.isArray(students) ? students : [])
    .filter((s) => {
      if (selectedCourseFilter) {
        const courseId = String(s.course_id || s.courseId || s.course?.course_id || s.course?.id || "");
        if (courseId !== selectedCourseFilter) return false;
      }
      if (!searchQuery || !searchQuery.trim()) return true;
      const full = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ").toLowerCase();
      return full.includes(searchQuery.trim().toLowerCase());
    })
    .slice()
    .sort((a, b) => {
      const nameA = [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ").trim().toLowerCase();
      const nameB = [b.first_name, b.middle_name, b.last_name].filter(Boolean).join(" ").trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

  return (
    <div className="min-h-screen p-6" style={{ background: "radial-gradient(circle at top, #e0f2fe, #f0f9ff 35%, #f8fafc 78%)" }}>
      <Toaster position="top-right" />
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .transcript-print-area,
          .transcript-print-area * {
            visibility: visible !important;
          }
          .transcript-print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8px !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }
          .transcript-print-area, .transcript-print-area * {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.2 !important;
            font-size: 12px !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 rounded-2xl bg-slate-700 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-800"
      >
        ← Back
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Generate Student Transcript</h1>
        <p className="mt-1 text-slate-600">Select student, course, and term (level applies only for modular/stage/grade/level-based courses).</p>
      </div>

      {/* Controls */}
      <div className="mb-6 rounded-[28px] border border-sky-100 bg-white/95 p-5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.course_id || course.id} value={course.course_id || course.id}>
                {course.course_name || course.name || `Course ${course.course_id || course.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {/* Student Dropdown (uses student's course info) */}
          <select
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={selectedStudent}
            onChange={handleStudentChange}
          >
            <option value="">Select Student</option>
            {displayedStudents.map((s) => {
              const labelName = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ").trim();
              const academicLevel = getStudentAcademicLevel(s);
              return (
                <option key={s.id} value={s.id}>
                  {labelName}
                  {academicLevel ? ` — ${academicLevel}` : ""}
                  {s.reg_no ? ` (${s.reg_no})` : ""}
                </option>
              );
            })}
          </select>

          {/* Level Dropdown (Dynamic based on student's course type) */}
          {selectedCourseType !== "non_modular" && (
            <select
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
              value={selectedLevel}
              onChange={handleLevelChange}
              disabled={!selectedCourseType}
            >
              <option value="">{getLevelLabel()}</option>
              {availableLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          )}

          {/* Term Dropdown (Dynamic based on level or non-modular student course) */}
          <select
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            disabled={selectedCourseType === "non_modular" ? !selectedStudent : !selectedLevel}
          >
            <option value="">Select Term</option>
            {availableTerms.map((t) => (
              <option key={t} value={t}>
                Term {t}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <div className="mt-4">
          <button 
            onClick={handleGenerate} 
            disabled={loading || !selectedStudent || (selectedCourseType !== "non_modular" && !selectedLevel) || !selectedTerm}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Transcript"}
          </button>
        </div>

        {/* Action Buttons */}
        {transcript && (
          <div className="mt-4 flex gap-3">
            <button 
              onClick={downloadPDF} 
              className="flex-1 rounded-2xl bg-emerald-600 px-5 py-2 font-semibold text-white transition hover:bg-emerald-700"
            >
              Download PDF
            </button>
            <button 
              onClick={handlePrint} 
              className="flex-1 rounded-2xl bg-amber-500 px-5 py-2 font-semibold text-white transition hover:bg-amber-600"
            >
              Print
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-slate-600">Loading transcript...</div>
        </div>
      )}

      {transcript && (
        <div ref={transcriptRef} className="pdf-a4 transcript-print-area rounded-[28px] bg-white p-4 shadow-lg border border-sky-100">
          {/* Header */}
          <div className="text-center mb-6">
            <img 
              src="/uploads/school/logo.png" 
              alt="School Logo" 
              className="mx-auto mb-3 w-24 h-24 object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h2 className="text-2xl font-bold text-slate-900 mb-1">STUDENT TRANSCRIPT</h2>
            <h3 className="font-semibold text-lg text-slate-800">St John Paul II Institute</h3>
            <p className="text-slate-600 text-sm">P.O. BOX 300 - 90200</p>
            <p className="text-slate-600 text-sm">Phone: 0706333977</p>
            <p className="text-slate-600 text-sm">Email: stjohnpauliiinstitute@gmail.com</p>
          </div>

          {/* Student Info */}
          <div className="mb-5 p-4 rounded-xl bg-sky-50 border border-sky-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><strong className="text-slate-700">Name:</strong> <span className="text-slate-900">{displayName()}</span></p>
              {transcript.student.regNo && <p><strong className="text-slate-700">Reg No:</strong> <span className="text-slate-900">{transcript.student.regNo}</span></p>}
              {transcript.student.courseName && <p><strong className="text-slate-700">Course:</strong> <span className="text-slate-900">{transcript.student.courseName}</span></p>}
              {selectedLevel && selectedCourseType && selectedCourseType !== "non_modular" && (
                <p><strong className="text-slate-700">Level:</strong> <span className="text-slate-900">{getLevelDisplayText()}</span></p>
              )}
              {selectedTerm && <p><strong className="text-slate-700">Term:</strong> <span className="text-slate-900">Term {selectedTerm}</span></p>}
            </div>
          </div>

          {/* Marks Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-sky-100 to-cyan-50">
                  <th className="border border-sky-200 p-2 text-left text-slate-800">Unit Code</th>
                  <th className="border border-sky-200 p-2 text-left text-slate-800">Unit Name</th>
                  <th className="border border-sky-200 p-2 text-center text-slate-800">CAT</th>
                  <th className="border border-sky-200 p-2 text-center text-slate-800">Exam</th>
                  <th className="border border-sky-200 p-2 text-center text-slate-800">Total</th>
                  <th className="border border-sky-200 p-2 text-center text-slate-800">Grade</th>
                  <th className="border border-sky-200 p-2 text-center text-slate-800">Attendance (%)</th>
                </tr>
              </thead>
              <tbody>
                {transcript.marks.map((m, idx) => (
                  <tr key={idx} className="hover:bg-sky-50/50 transition">
                    <td className="border border-sky-100 p-2 text-slate-700">{m.unit_code}</td>
                    <td className="border border-sky-100 p-2 text-slate-700">{m.unit_name}</td>
                    <td className="border border-sky-100 p-2 text-center font-medium">
                      <span className={m.cat_mark === "ABS" ? "text-red-600" : "text-slate-700"}>
                        {m.cat_mark}
                      </span>
                    </td>
                    <td className="border border-sky-100 p-2 text-center font-medium">
                      <span className={m.exam_mark === "ABS" ? "text-red-600" : "text-slate-700"}>
                        {m.exam_mark}
                      </span>
                    </td>
                    <td className="border border-sky-100 p-2 text-center font-semibold">
                      <span className={m.total === "ABS" ? "text-red-600" : "text-slate-900"}>
                        {m.total}
                      </span>
                    </td>
                    <td className="border border-sky-100 p-2 text-center font-semibold">
                      <span className={m.grade === "ABS" ? "text-red-600" : "text-slate-900"}>
                        {m.grade}
                      </span>
                    </td>
                    <td className="border border-sky-100 p-2 text-center">
                      <span className={m.attendance === "ABS" ? "text-red-600" : "text-slate-700"}>
                        {m.attendance != null ? m.attendance : "ABS"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {transcript.summary && (
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {transcript.summary.overallAverage != null && (
                  <p><strong className="text-slate-700">Overall Average:</strong> <span className="font-semibold text-slate-900">{transcript.summary.overallAverage}</span></p>
                )}
                {transcript.summary.finalGrade && (
                  <p><strong className="text-slate-700">Final Grade:</strong> <span className="font-semibold text-slate-900">{transcript.summary.finalGrade}</span></p>
                )}
                {transcript.summary.remarks && (
                  <p><strong className="text-slate-700">Remarks:</strong> <span className="text-slate-900">{transcript.summary.remarks}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Footer with signatures */}
          <div className="mt-6">
            <p className="text-sm text-slate-600"><strong>Issued on:</strong> {transcript.summary.generatedAt}</p>
            <div className="transcript-signatures flex justify-between mt-4 gap-6">
              <div className="text-center flex-1">
                <p className="mb-2 font-bold text-slate-800 text-[12px]">Manager</p>
                <p className="text-slate-600 text-[12px]">___________________</p>
              </div>
              <div className="text-center flex-1">
                <p className="mb-2 font-bold text-slate-800 text-[12px]">Examination Officer</p>
                <p className="text-slate-600 text-[12px]">___________________</p>
              </div>
              <div className="text-center flex-1">
                <p className="mb-2 font-bold text-slate-800 text-[12px]">Senior Teacher</p>
                <p className="text-slate-600 text-[12px]">___________________</p>
              </div>
            </div>
            <p className="mt-4 text-center italic text-xs text-slate-500">This is a system-generated transcript.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateTranscript;
