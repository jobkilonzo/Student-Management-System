import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async (stageKey = "") => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/student/results", {
        params: { stage: stageKey },
      });

      const data = res.data.data ?? [];
      setResults(data);

      if (res.data.stages) {
        setStages(res.data.stages);
        setSelectedStage(res.data.selected_stage.key);
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = (e) => {
    const stageKey = e.target.value;
    setSelectedStage(stageKey);
    fetchResults(stageKey);
  };

  const handleBack = () => navigate("/student/dashboard");

  const average =
    results.length > 0
      ? (
          results.reduce((sum, r) => sum + Number(r.total || 0), 0) /
          results.length
        ).toFixed(2)
      : 0;

  const knecEligibility =
    results.length > 0
      ? results.every((r) => r.attendance >= 75)
        ? "Eligible"
        : "Not Eligible (Attendance < 75%)"
      : "-";

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition mb-4"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-800">
            Academic Results
          </h1>

          {/* Stage Selection */}
          {stages.length > 0 && (
            <select
              value={selectedStage}
              onChange={handleStageChange}
              className="mt-3 p-2 border rounded"
            >
              {stages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          )}

          {!loading && results.length > 0 && (
            <p className="mt-2 text-lg font-semibold text-gray-700">
              Average Score: <span className="text-blue-600">{average}%</span>
              <br />
              KNEC Eligibility:{" "}
              <span
                className={`font-bold ${
                  knecEligibility.startsWith("Eligible")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {knecEligibility}
              </span>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">Loading results...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results available yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Unit Code</th>
                    <th className="p-3 text-left">Unit Name</th>
                    <th className="p-3 text-left">CAT Marks</th>
                    <th className="p-3 text-left">End Term Marks</th>
                    <th className="p-3 text-left">Total Marks</th>
                    <th className="p-3 text-left">Grade</th>
                    <th className="p-3 text-left">Attendance (%)</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    const grade = result.grade;
                    const status =
                      result.is_locked === 1 ? "Finalized" : "Pending";

                    return (
                      <tr
                        key={index}
                        className="border-b hover:bg-blue-50 transition"
                      >
                        <td className="p-3 font-semibold text-blue-600">
                          {result.unit_code}
                        </td>
                        <td className="p-3">{result.unit_name}</td>
                        <td className="p-3">{result.cat_mark ?? "-"}</td>
                        <td className="p-3">{result.exam_mark ?? "-"}</td>
                        <td className="p-3 font-semibold">{result.total ?? "-"}</td>
                        <td className="p-3">
                          {grade ? (
                            <span
                              className={`px-2 py-1 rounded text-sm font-semibold ${
                                grade === "A" || grade === "A-"
                                  ? "bg-green-100 text-green-800"
                                  : grade.startsWith("B")
                                  ? "bg-blue-100 text-blue-800"
                                  : grade.startsWith("C")
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {grade}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3">{result.attendance ?? "-"}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              result.is_locked === 1
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;