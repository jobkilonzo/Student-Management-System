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
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 p-8">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transcript Log</h1>
          <button
            onClick={() => navigate("/admin")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Admin Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="border rounded-lg p-2"
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
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Generating..." : "Generate Transcript"}
          </button>

          <div className="text-sm text-gray-600">
            Total requests: {history.length}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Transcript History</h2>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
            {history.length === 0 ? (
              <p className="text-gray-500">No transcripts generated yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((record) => (
                  <li key={record.id} className="p-2 border rounded-lg bg-gray-50">
                    <strong>{record.studentName}</strong> - {new Date(record.generatedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {transcript && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Latest Transcript Summary</h2>
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
