import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const ManageExamsPro = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    unit_id: "",
    course_id: "",
    module: "",
    exam_date: "",
    max_marks: 100,
    pass_marks: 40,
    marks_allowed_from: "",
    marks_allowed_to: "",
  });

  const selectedClass = useMemo(() => {
    const unitId = Number(form.unit_id);
    return classes.find((c) => Number(c.unit_id) === unitId) || null;
  }, [classes, form.unit_id]);

  useEffect(() => {
    const load = async () => {
      try {
        const [classesRes, schedulesRes] = await Promise.all([
          makeRequest.get("/attendance/today"),
          makeRequest.get("/exams"),
        ]);
        setClasses(classesRes.data.classes || []);
        setSchedules(schedulesRes.data.schedules || []);
      } catch (err) {
        console.error(err);
        setClasses([]);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setForm((prev) => ({
      ...prev,
      course_id: String(selectedClass.course_id ?? prev.course_id ?? ""),
      module: String(selectedClass.module ?? prev.module ?? ""),
    }));
  }, [selectedClass]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      unit_id: "",
      course_id: "",
      module: "",
      exam_date: "",
      max_marks: 100,
      pass_marks: 40,
      marks_allowed_from: "",
      marks_allowed_to: "",
    });
  };

  const refreshSchedules = async () => {
    const schedulesRes = await makeRequest.get("/exams");
    setSchedules(schedulesRes.data.schedules || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        unit_id: Number(form.unit_id),
        course_id: Number(form.course_id),
        module: form.module || null,
        exam_date: form.exam_date || null,
        max_marks: Number(form.max_marks),
        pass_marks: Number(form.pass_marks),
        marks_allowed_from: form.marks_allowed_from || null,
        marks_allowed_to: form.marks_allowed_to || null,
      };

      if (editingId) {
        await makeRequest.put(`/exams/${editingId}`, payload);
      } else {
        await makeRequest.post("/exams", payload);
      }

      await refreshSchedules();
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sch) => {
    setEditingId(sch.id);
    setForm({
      unit_id: String(sch.unit_id),
      course_id: String(sch.course_id),
      module: sch.module || "",
      exam_date: sch.exam_date ? String(sch.exam_date).slice(0, 10) : "",
      max_marks: sch.max_marks ?? 100,
      pass_marks: sch.pass_marks ?? 40,
      marks_allowed_from: sch.marks_allowed_from ? String(sch.marks_allowed_from).slice(0, 16) : "",
      marks_allowed_to: sch.marks_allowed_to ? String(sch.marks_allowed_to).slice(0, 16) : "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam schedule?")) return;
    try {
      await makeRequest.delete(`/exams/${id}`);
      await refreshSchedules();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete schedule");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/exam-officer")} className="text-sm font-semibold text-sky-700">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Exam Schedules</h1>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Schedule" : "Create Schedule"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Set marks entry windows using <span className="font-semibold">Marks Allowed From/To</span>.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Assigned Class</span>
              <select
                value={form.unit_id}
                onChange={(e) => setForm((p) => ({ ...p, unit_id: e.target.value }))}
                required
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

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Exam Date</span>
              <input
                type="date"
                value={form.exam_date}
                onChange={(e) => setForm((p) => ({ ...p, exam_date: e.target.value }))}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Marks Allowed From</span>
              <input
                type="datetime-local"
                value={form.marks_allowed_from}
                onChange={(e) => setForm((p) => ({ ...p, marks_allowed_from: e.target.value }))}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Marks Allowed To</span>
              <input
                type="datetime-local"
                value={form.marks_allowed_to}
                onChange={(e) => setForm((p) => ({ ...p, marks_allowed_to: e.target.value }))}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Max Marks</span>
              <input
                type="number"
                value={form.max_marks}
                onChange={(e) => setForm((p) => ({ ...p, max_marks: e.target.value }))}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Pass Marks</span>
              <input
                type="number"
                value={form.pass_marks}
                onChange={(e) => setForm((p) => ({ ...p, pass_marks: e.target.value }))}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <div className="md:col-span-2 flex justify-end gap-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Schedule" : "Create Schedule"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <h2 className="text-lg font-semibold text-slate-900">Existing Schedules</h2>

          {loading ? (
            <div className="mt-4 text-slate-600">Loading…</div>
          ) : schedules.length === 0 ? (
            <div className="mt-4 text-slate-600">No schedules yet.</div>
          ) : (
            <div className="mt-4 overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
              <table className="min-w-full">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Module</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Allowed</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="bg-white transition hover:bg-sky-50/60">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{sch.unit_name || sch.unit_id}</div>
                        <div className="text-sm text-slate-500">{sch.unit_code || ""}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{sch.course_name || sch.course_id}</td>
                      <td className="px-5 py-4 text-slate-700">{sch.module || "—"}</td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="text-xs text-slate-500">From</div>
                        <div>{sch.marks_allowed_from ? String(sch.marks_allowed_from).replace("T", " ").slice(0, 16) : "—"}</div>
                        <div className="mt-2 text-xs text-slate-500">To</div>
                        <div>{sch.marks_allowed_to ? String(sch.marks_allowed_to).replace("T", " ").slice(0, 16) : "—"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEdit(sch)}
                            className="rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(sch.id)}
                            className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageExamsPro;

