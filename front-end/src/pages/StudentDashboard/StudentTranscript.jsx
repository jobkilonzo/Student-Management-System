import { useState, useEffect, useRef } from "react";
import { makeRequest } from "../../../axios";
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const StudentTranscript = () => {
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableTerms, setAvailableTerms] = useState([]);
  const [courseType, setCourseType] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const transcriptRef = useRef();

  // Term mapping based on course type
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

  // Fetch course info on component mount
  useEffect(() => {
    fetchCourseInfo();
  }, []);

  const fetchCourseInfo = async () => {
    try {
      const res = await makeRequest.get("/student/available-levels");
      const normalizedType = normalizeCourseType(res.data.courseType);
      setCourseType(normalizedType || "modular");
      setCourseName(res.data.courseName || "");
      setAvailableLevels(res.data.availableLevels || []);

      // If non-modular, set available terms directly
      if (normalizedType === "non_modular") {
        setAvailableTerms([1, 2, 3]);
      }
    } catch (err) {
      console.error("Error fetching course info:", err);
      toast.error("Failed to load course information");
    }
  };

  const normalizeCourseType = (type) => {
    if (!type) return null;
    const cleaned = String(type)
      .trim()
      .toLowerCase()
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

  // Handle level change
  const handleLevelChange = (e) => {
    const levelValue = e.target.value;
    setSelectedLevel(levelValue);
    setSelectedTerm("");

    if (levelValue && courseType && courseType !== "non_modular") {
      const terms = termMapping[courseType]?.[levelValue] || [];
      setAvailableTerms(terms);
    } else {
      setAvailableTerms([]);
    }
  };

  const getLevelLabel = () => {
    if (!courseType) return "Select Level";
    switch (courseType) {
      case "modular":
        return "Select Module";
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

  const getLevelDisplayText = () => {
    if (!selectedLevel || !courseType) return "";
    if (courseType === "non_modular") return "";
    switch (courseType) {
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

  // Generate transcript
  const handleGenerate = async () => {
    const requiresLevel = courseType && courseType !== "non_modular";
    if (requiresLevel && !selectedLevel) {
      toast.error("Please select level");
      return;
    }

    if (!selectedTerm) {
      toast.error("Please select term");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTerm) params.set("term", String(selectedTerm));

      if (courseType !== "non_modular" && selectedLevel) {
        params.set("level", String(selectedLevel));
        switch (courseType) {
          case "modular":
            params.set("module", String(selectedLevel));
            break;
          case "stage_based":
            params.set("stage", String(selectedLevel));
            break;
          case "grade_system":
            params.set("grade", String(selectedLevel));
            break;
          case "level_based":
            params.set("academic_level", String(selectedLevel));
            break;
          default:
            break;
        }
      }

      const url = `/student/transcript?${params.toString()}`;
      const res = await makeRequest.get(url);

      // Insert ABS for units with missing marks
      const data = res.data;
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

    const name = transcript.student.name || "Unknown Student";
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

  const handlePrint = () => {
    if (!transcript) return;

    const element = transcriptRef.current;
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      toast.error("Unable to open print preview. Please allow popups for this site.");
      return;
    }

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
      body { padding: 0; }
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
      .pdf-a4 p, .pdf-a4 td, .pdf-a4 th { line-height: 1.4 !important; }
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
      .pdf-a4 thead tr { background: #e0f2fe !important; }
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
        <h1 className="text-3xl font-bold text-slate-900">My Transcript</h1>
        <p className="mt-1 text-slate-600">Select module/stage/level and term to generate your transcript.</p>
      </div>

      {/* Controls */}
      <div className="mb-6 rounded-[28px] border border-sky-100 bg-white/95 p-5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {courseType !== "non_modular" && (
            <select
              className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={selectedLevel}
              onChange={handleLevelChange}
            >
              <option value="">{getLevelLabel()}</option>
              {availableLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          )}

          <select
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            disabled={courseType === "non_modular" ? false : !selectedLevel}
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
        <button 
          onClick={handleGenerate} 
          disabled={loading || (courseType !== "non_modular" && !selectedLevel) || !selectedTerm}
          className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate Transcript"}
        </button>

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
              <p><strong className="text-slate-700">Name:</strong> <span className="text-slate-900">{transcript.student.name}</span></p>
              {transcript.student.regNo && <p><strong className="text-slate-700">Reg No:</strong> <span className="text-slate-900">{transcript.student.regNo}</span></p>}
              {transcript.student.courseName && <p><strong className="text-slate-700">Course:</strong> <span className="text-slate-900">{transcript.student.courseName}</span></p>}
              {selectedLevel && courseType && courseType !== "non_modular" && (
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

export default StudentTranscript;
