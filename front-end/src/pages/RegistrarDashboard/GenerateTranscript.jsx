import { useState, useEffect, useRef } from "react";
import { makeRequest } from "../../../axios";
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom"; // <-- import this
const GenerateTranscript = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
const navigate = useNavigate(); // <-- initialize navigate

  const transcriptRef = useRef();

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await makeRequest.get("/registrar/students");
        setStudents(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, []);

  // Generate transcript
  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const res = await makeRequest.get(
        `/registrar/transcript/transcript/${selectedStudent}`
      );
      setTranscript(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF safely
// PDF-safe filename: first name + last name
const downloadPDF = () => {
  if (!transcript) return;
  const element = transcriptRef.current;

  // Force PDF-safe background
  element.style.backgroundColor = "#ffffff";
  element.style.backgroundImage = "none";

  const name = transcript.student.name || "";
  
  const fileName =
    name
      ? `${name}_transcript.pdf`
      : "student_transcript.pdf";

  html2pdf()
    .from(element)
    .set({
      margin: 0.5,
      filename: fileName,
      html2canvas: { scale: 2, logging: true, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    })
    .save()
    .finally(() => {
      element.style.backgroundColor = "";
      element.style.backgroundImage = "";
    });
};
  // Display full name
  const displayName = () => {
    const s = transcript?.student;
    if (!s) return "";
    return (
      [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") ||
      s.name ||
      "Unknown Student"
    );
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "radial-gradient(circle at top, #e0f2fe, #f0f9ff 35%, #f8fafc 78%)" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)} // <-- go back to previous page
        className="mb-4 rounded-xl px-4 py-2 text-white"
        style={{ backgroundColor: "#334155", color: "#ffffff" }}
      >
        Back
      </button>
      <h1 style={{ color: "#0f172a" }} className="mb-4 text-3xl font-bold">
        Generate Student Transcript
      </h1>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2 rounded-[28px] border border-sky-100 bg-white/95 p-5 shadow-lg">
        <select
          className="rounded-xl border border-sky-200 p-3"
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

        <button
          onClick={handleGenerate}
          className="px-4 py-2 rounded"
          style={{ backgroundColor: "#0284c7", color: "#ffffff" }}
        >
          Generate
        </button>

        {transcript && (
          <>
            <button
              onClick={downloadPDF}
              className="px-4 py-2 rounded"
              style={{ backgroundColor: "#0369a1", color: "#ffffff" }}
            >
              Download PDF
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded"
              style={{ backgroundColor: "#f59e0b", color: "#ffffff" }}
            >
              Print
            </button>
          </>
        )}
      </div>

      {loading && <p>Loading transcript...</p>}

      {/* Transcript */}
      {transcript && (
        <div
          ref={transcriptRef}
          className="p-8 rounded-xl shadow-lg border"
          style={{ backgroundColor: "#ffffff", backgroundImage: "none" }}
        >
          {/* Header */}
          <h2 style={{ color: "#1e293b" }} className="text-center text-2xl font-bold mb-2">
            STUDENT TRANSCRIPT
          </h2>

          <div className="text-center mb-4">
            <h3 style={{ color: "#1e293b" }} className="font-semibold text-lg">
              St John Paul II Institute
            </h3>
            <p style={{ color: "#1e293b" }}>P.O. BOX 300 - 90200</p>
            <p style={{ color: "#1e293b" }}>Phone: 0706333977 / 0726607683</p>
            <p style={{ color: "#1e293b" }}>Email: stjohnpauliiinstitute@gmail.com</p>
          </div>

          {/* Student Info */}
          <div className="mb-4" style={{ color: "#1e293b" }}>
            <p><strong>Name:</strong> {displayName()}</p>
            <p><strong>Reg No:</strong> {transcript.student.regNo || "-"}</p>
            <p><strong>Course:</strong> {transcript.student.courseName || transcript.student.course_id || "-"}</p>
            <p><strong>Module:</strong> {transcript.student.module || "-"}</p>
            <p><strong>Term:</strong> {transcript.student.term || "-"}</p>
          </div>

          {/* Marks Table */}
          <table className="w-full border-collapse border text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th className="border p-2">Unit Code</th>
                <th className="border p-2">Unit Name</th>
                <th className="border p-2">CAT</th>
                <th className="border p-2">Exam</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Grade</th>
                <th className="border p-2">Attendance (%)</th>
              </tr>
            </thead>
            <tbody style={{ color: "#1e293b" }}>
              {transcript.marks.map((m, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{m.unit_code}</td>
                  <td className="border p-2">{m.unit_name}</td>
                  <td className="border p-2">{m.cat_mark}</td>
                  <td className="border p-2">{m.exam_mark}</td>
                  <td className="border p-2">{m.total}</td>
                  <td className="border p-2">{m.grade}</td>
                  <td className="border p-2">{m.attendance || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-4" style={{ color: "#1e293b" }}>
            <p><strong>Overall Average:</strong> {transcript.summary.overallAverage || "-"}</p>
            <p><strong>Final Grade:</strong> {transcript.summary.finalGrade || "-"}</p>
            <p><strong>Remarks:</strong> {transcript.summary.remarks || "-"}</p>
          </div>

          {/* Footer */}
          <div className="mt-6" style={{ color: "#1e293b" }}>
            <p><strong>Issued on:</strong> {transcript.summary.generatedAt || "-"}</p>
            <br />
            <p>Authorized Signatory: ___________________</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateTranscript;
