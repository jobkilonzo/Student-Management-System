import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";

const TranscriptLog = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await makeRequest.get("/registrar/students");
      setStudents(res.data || []);
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast.error("Unable to fetch students");
    }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) {
      toast.error("Choose a student first");
      return;
    }

    try {
      setLoading(true);
      const res = await makeRequest.get(`/registrar/transcript/transcript/${selectedStudent}`);
      setTranscript(res.data);
      const record = {
        id: Date.now(),
        studentId: selectedStudent,
        studentName: `${res.data.student.name || "Unknown"}`,
        generatedAt: res.data.summary?.generatedAt || new Date().toISOString(),
      };
      setHistory((prev) => [record, ...prev]);
      toast.success("Transcript generated");
    } catch (error) {
      console.error(error);
      toast.error("Transcript generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-8">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
              Academic Records
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Transcript Log</h1>
            <p className="mt-2 text-sm text-slate-600">Generate transcript previews and review recent transcript activity.</p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Back to Admin Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="rounded-2xl border border-sky-200 p-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          >
            <option value="">Pick a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.middle_name} {student.last_name} ({student.reg_no})
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedStudent || loading}
            className="rounded-2xl bg-sky-700 px-4 py-3 text-white transition hover:bg-sky-800"
          >
            {loading ? "Generating..." : "Generate Transcript"}
          </button>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Total requests: {history.length}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-slate-900">Transcript History</h2>
          <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 p-3">
            {history.length === 0 ? (
              <p className="text-gray-500">No transcripts generated yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((record) => (
                  <li key={record.id} className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
                    <strong>{record.studentName}</strong> - {new Date(record.generatedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {transcript && (
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
            <h2 className="text-xl font-semibold mb-2 text-slate-900">Latest Transcript Summary</h2>
            <p><strong>Name:</strong> {transcript.student.name}</p>
            <p><strong>Reg No:</strong> {transcript.student.regNo}</p>
            <p><strong>Course:</strong> {transcript.student.courseName}</p>
            <p><strong>Average:</strong> {transcript.summary?.overallAverage}</p>
            <p><strong>Grade:</strong> {transcript.summary?.finalGrade}</p>
            <p><strong>Remarks:</strong> {transcript.summary?.remarks}</p>
            <p><strong>Generated:</strong> {transcript.summary?.generatedAt}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptLog;
