import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import EnterMarksPagePro from "../Tutor/EnterMarksPagePro";

const ReviewMarksPro = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [summary, setSummary] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await makeRequest.get("/attendance/today");
        setClasses(res.data.classes || []);
      } catch (err) {
        console.error(err);
        setClasses([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      if (!selectedUnitId) {
        setSummary(null);
        return;
      }
      try {
        const res = await makeRequest.get(`/marks/summary/unit/${selectedUnitId}`);
        setSummary(res.data);
      } catch (err) {
        console.error(err);
        setSummary(null);
      }
    };

    loadSummary();
  }, [selectedUnitId]);

  const handleUpload = async () => {
    if (!file) return alert("Choose a file first.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await makeRequest.post("/marks/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Upload successful.");
      setFile(null);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Upload failed";
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedUnitId) return alert("Select a unit first.");
    setBusy(true);
    try {
      await makeRequest.post("/marks/release", { unitId: Number(selectedUnitId) });
      alert("Marks released. Students notified (in-app).");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Release failed");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    if (!selectedUnitId) return alert("Select a unit first.");
    try {
      const res = await makeRequest.get(`/marks/export/${selectedUnitId}.csv`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `marks_unit_${selectedUnitId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Export failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/exam-officer")} className="text-sm font-semibold text-sky-700">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Marks Management</h1>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            <label className="block md:col-span-1">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Unit</span>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Select unit</option>
                {classes.map((c) => (
                  <option key={c.assignment_id} value={c.unit_id}>
                    {c.subject} ({c.course_code}) {c.module ? `- ${c.module}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-1">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Bulk Upload (Excel/CSV)</span>
              <input
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                onClick={handleUpload}
                disabled={busy}
                className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
              >
                Upload
              </button>
              <button
                onClick={handleExport}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Export CSV
              </button>
              <button
                onClick={handleRelease}
                disabled={busy}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                Release Marks
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            Marks entry is blocked until the schedule’s <span className="font-semibold">Marks Allowed From</span> time (if set).
          </p>
        </div>

        {summary?.stats ? (
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Unit Summary</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pass mark: <span className="font-semibold">{summary.pass_marks ?? 40}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  Students: {summary.stats.total_students}
                </span>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                  With marks: {summary.stats.with_marks}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Pass: {summary.stats.pass_count}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Avg: {summary.stats.avg_total ?? "—"}
                </span>
              </div>
            </div>

            {Array.isArray(summary.grades) && summary.grades.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.grades.map((g) => (
                  <span
                    key={`${g.grade}-${g.count}`}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {g.grade}: {g.count}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <EnterMarksPagePro />
      </div>
    </div>
  );
};

export default ReviewMarksPro;
