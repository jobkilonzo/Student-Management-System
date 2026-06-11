import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";

const EXAM_TYPES = [
  { value: "Normal", label: "Normal Exam Timetable" },
  { value: "Supplementary", label: "Supplementary Exam Timetable" },
];

const RegistrarExamTimetableBusiness = () => {
  const department = "Business";
  const [loading, setLoading] = useState(false);
  const [timetablesLoading, setTimetablesLoading] = useState(false);

  const [filters, setFilters] = useState({
    term: "",
    department_filter: "",
    intake: "",
    course_id: "",
  });

  const [form, setForm] = useState({
    date_start: "",
    date_end: "",
    exam_type: "Normal",
  });

  const [courses, setCourses] = useState([]);
  const [latest, setLatest] = useState(null);

  const title = useMemo(() => `${department} Courses Exam Timetable`, [department]);

  const loadLatest = async () => {
    setTimetablesLoading(true);
    try {
      const res = await makeRequest.get(`/exams/timetable/business`, {
        params: { exam_type: form.exam_type },
      });
      const rows = res?.data?.timetables || [];
      if (!rows.length) {
        setLatest(null);
        return;
      }
      const id = rows[0].id;
      const details = await makeRequest.get(`/exams/timetable/${id}`);
      setLatest(details?.data?.timetable || null);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load timetables");
    } finally {
      setTimetablesLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await makeRequest.get("/registrar/courses", {
        params: { course_category: department },
      });
      setCourses(res.data || []);
    } catch (err) {
      toast.error("Failed to load courses for this category");
    }
  };

  useEffect(() => {
    loadCourses();
    loadLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async (e) => {
    e.preventDefault();
    if (!form.date_start || !form.date_end || !form.exam_type) {
      toast.error("Start Date, End Date and Exam Type are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        ...filters,
        department,
      };

      const res = await makeRequest.post(`/exams/timetable/business`, payload);
      setLatest(res?.data?.timetable || null);
      toast.success("Timetable generated");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to generate timetable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />

      <button
        onClick={() => window.history.back()}
        className="mb-6 text-slate-700 font-medium hover:text-blue-600 transition"
      >
        ← Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600 mt-1">
          Generate sequential exams by date range (no sessions, no room allocation).
        </p>
      </div>

      <form onSubmit={generate} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Start Date</label>
            <input
              type="date"
              value={form.date_start}
              onChange={(e) => setForm((p) => ({ ...p, date_start: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">End Date</label>
            <input
              type="date"
              value={form.date_end}
              onChange={(e) => setForm((p) => ({ ...p, date_end: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Exam Type</label>
            <select
              value={form.exam_type}
              onChange={(e) => setForm((p) => ({ ...p, exam_type: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">TERM (Optional)</label>
            <input
              value={filters.term}
              onChange={(e) => setFilters((p) => ({ ...p, term: e.target.value }))}
              placeholder="e.g. 1"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Course (Optional)</label>
            <select
              value={filters.course_id}
              onChange={(e) => setFilters((p) => ({ ...p, course_id: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All {department} courses</option>
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Intake (Optional)</label>
            <select
              value={filters.intake}
              onChange={(e) => setFilters((p) => ({ ...p, intake: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Regular">Regular</option>
              <option value="Retake">Retake</option>
              <option value="Supplementary">Supplementary</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Timetable"}
          </button>
          <button
            type="button"
            onClick={loadLatest}
            disabled={timetablesLoading}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {timetablesLoading ? "Refreshing..." : "Refresh Latest"}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Latest Timetable</h2>
            <p className="text-sm text-slate-500">
              {latest ? `#${latest.id} • ${latest.exam_type}` : "No timetable found yet"}
            </p>
          </div>
        </div>

        {!latest ? (
          <div className="p-6 text-slate-500">No entries to display.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-sm font-semibold">Unit</th>
                  <th className="px-4 py-3 text-sm font-semibold">Course</th>
                </tr>
              </thead>
              <tbody>
                {(latest.entries || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      Timetable has no entries.
                    </td>
                  </tr>
                ) : (
                  latest.entries.map((row) => (
                    <tr key={row.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">{row.exam_date}</td>
                      <td className="px-4 py-3 text-sm">{row.exam_time}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {row.unit_code} - {row.unit_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.course_code} - {row.course_name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrarExamTimetableBusiness;
