import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";
import StudentPortalLayout from "./StudentPortalLayout";

const ResultsPro = () => {
  const [results, setResults] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState("");
  const [currentStage, setCurrentStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, [selectedStage]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const query = selectedStage ? `?stage=${encodeURIComponent(selectedStage)}` : "";
      const res = await makeRequest.get(`/student/results${query}`);
      const payload = res.data || {};

      if (Array.isArray(payload)) {
        setResults(payload);
        setStages([]);
      } else {
        setResults(Array.isArray(payload.data) ? payload.data : []);
        setStages(Array.isArray(payload.stages) ? payload.stages : []);
        setCurrentStage(payload.current_stage || null);

        if (!selectedStage && payload.selected_stage?.key) {
          setSelectedStage(payload.selected_stage.key);
        }
      }
      setError("");
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const average =
    results.length > 0
      ? (
          results.reduce((sum, r) => sum + Number(r.total || 0), 0) /
          results.length
        ).toFixed(2)
      : 0;

  return (
    <StudentPortalLayout
      title="Academic Results"
      subtitle="Review your assessment performance, confirmed grades, and finalized unit outcomes."
    >
      <div className="space-y-5">
        {!loading && results.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Units Assessed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{results.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Average Score</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{average}%</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Finalized Results</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {results.filter((result) => result.is_locked === 1).length}
              </p>
            </div>
          </div>
        )}

        {stages.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-2xl bg-sky-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Results View</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {stages.find((stage) => stage.key === selectedStage)?.label || "Current stage"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Current units and course stay tied to your active stage, while older results remain available here.
              </p>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Pick Results Stage</span>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="min-w-[280px] rounded-2xl border border-sky-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                {stages.map((stage) => (
                  <option key={stage.key} value={stage.key}>
                    {stage.is_current ? `Current: ${stage.label}` : `Previous: ${stage.label}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">Loading results...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results available yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100/90">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit Code</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit Name</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Module</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CAT Marks</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">End Term Marks</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Marks</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Grade</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((result, index) => {
                    const grade = result.grade;
                    const status = result.is_locked === 1 ? "Finalized" : "Pending";

                    return (
                      <tr
                        key={index}
                        className="border-b border-slate-200 bg-white transition hover:bg-blue-50/60"
                      >
                        <td className="p-4 font-semibold text-blue-700">{result.unit_code}</td>
                        <td className="p-4 text-slate-700">{result.unit_name}</td>
                        <td className="p-4 text-slate-700">{result.course_name || currentStage?.course_name || "-"}</td>
                        <td className="p-4 text-slate-700">{result.module || currentStage?.module || "-"}</td>
                        <td className="p-4 text-slate-700">{result.cat_mark ?? "-"}</td>
                        <td className="p-4 text-slate-700">{result.exam_mark ?? "-"}</td>
                        <td className="p-4 font-semibold text-slate-900">{result.total ?? "-"}</td>
                        <td className="p-4">
                          {grade ? (
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
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
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
    </StudentPortalLayout>
  );
};

export default ResultsPro;
