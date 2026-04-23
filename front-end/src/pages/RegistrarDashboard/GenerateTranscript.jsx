import { useState, useEffect, useRef } from "react";
import { makeRequest } from "../../../axios";
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const GenerateTranscript = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableTerms, setAvailableTerms] = useState([]);
  const [selectedCourseType, setSelectedCourseType] = useState(null);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [transcript, setTranscript] = useState(null);
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
      setStudents(res.data);
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
  const getCourseDetails = (courseId) => {
    if (!courseId) return { type: null, name: "" };
    const selectedCourseData = courses.find(c => c.course_id === parseInt(courseId));
    if (!selectedCourseData) return { type: null, name: "" };
    return {
      type: selectedCourseData.course_type || "modular",
      name: selectedCourseData.course_name || ""
    };
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
    if (!courseType || !levelValue) return [];
    
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

  // Handle course change
  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedLevel("");
    setSelectedTerm("");
    setAvailableLevels([]);
    setAvailableTerms([]);
    
    if (courseId) {
      const { type: courseType, name: courseName } = getCourseDetails(courseId);
      setSelectedCourseType(courseType);
      setSelectedCourseName(courseName);
      
      const levels = getAvailableLevels(courseType, courseName);
      setAvailableLevels(levels);
    } else {
      setSelectedCourseType(null);
      setSelectedCourseName("");
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

  // Generate transcript
  const handleGenerate = async () => {
    if (!selectedStudent || !selectedCourse || !selectedLevel || !selectedTerm) {
      toast.error("Please select student, course, level, and term");
      return;
    }
    
    setLoading(true);
    try {
      const res = await makeRequest.get(
        `/registrar/transcript/transcript/${selectedStudent}?level=${selectedLevel}&term=${selectedTerm}`
      );
      const data = res.data;

      // Insert ABS for units with missing marks
      data.marks = data.marks.map((m) => ({
        ...m,
        cat_mark: m.cat_mark != null ? m.cat_mark : "ABS",
        exam_mark: m.exam_mark != null ? m.exam_mark : "ABS",
        total: m.total != null ? m.total : "ABS",
        grade: m.grade != null ? m.grade : "ABS",
      }));

      setTranscript(data);
      toast.success("Transcript generated successfully!");
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

    const name = transcript.student.name || displayName();
    const fileName = name ? `${name.replace(/\s+/g, '_')}_transcript.pdf` : "student_transcript.pdf";

    html2pdf()
      .from(element)
      .set({
        margin: 0.5,
        filename: fileName,
        html2canvas: { scale: 2, logging: false, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
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
      });
  };

  // Print transcript
  const handlePrint = () => {
    window.print();
  };

  const displayName = () => {
    const s = transcript?.student;
    if (!s) return "";
    return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") || s.name || "Unknown Student";
  };

  const getLevelDisplayText = () => {
    if (!selectedLevel || !selectedCourseType) return "";
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

  return (
    <div className="min-h-screen p-6" style={{ background: "radial-gradient(circle at top, #e0f2fe, #f0f9ff 35%, #f8fafc 78%)" }}>
      <Toaster position="top-right" />
      
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 rounded-2xl bg-slate-700 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-800"
      >
        ← Back
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Generate Student Transcript</h1>
        <p className="mt-1 text-slate-600">Select student, course, level, and term to generate academic transcript</p>
      </div>

      {/* Controls */}
      <div className="mb-6 rounded-[28px] border border-sky-100 bg-white/95 p-5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Student Dropdown */}
          <select
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.middle_name} {s.last_name} ({s.reg_no})
              </option>
            ))}
          </select>

          {/* Course Dropdown */}
          <select
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={selectedCourse}
            onChange={handleCourseChange}
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_name} ({c.course_code}) - {c.course_type === 'modular' ? 'Modular' : c.course_type?.replace('_', ' ') || 'Modular'}
              </option>
            ))}
          </select>

          {/* Level Dropdown (Dynamic based on course type) */}
          <select
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedLevel}
            onChange={handleLevelChange}
            disabled={!selectedCourse}
          >
            <option value="">{getLevelLabel()}</option>
            {availableLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>

          {/* Term Dropdown (Dynamic based on level) */}
          <select
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            disabled={!selectedLevel}
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
            disabled={loading || !selectedStudent || !selectedCourse || !selectedLevel || !selectedTerm}
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
        <div ref={transcriptRef} className="rounded-[28px] bg-white p-8 shadow-lg border border-sky-100">
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
              {selectedLevel && selectedCourseType && <p><strong className="text-slate-700">Level:</strong> <span className="text-slate-900">{getLevelDisplayText()}</span></p>}
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
            <div className="flex justify-between mt-8">
              <div className="text-center">
                <p className="mb-6 font-bold text-slate-800">Manager</p>
                <p className="text-slate-600">___________________</p>
              </div>
              <div className="text-center">
                <p className="mb-6 font-bold text-slate-800">Senior Teacher</p>
                <p className="text-slate-600">___________________</p>
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