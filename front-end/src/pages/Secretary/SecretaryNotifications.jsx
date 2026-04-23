import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";

const types = [
  { value: "enrollment_confirmation", label: "Enrollment Confirmation" },
  { value: "fee_reminder", label: "Fee Reminder" },
  { value: "general_announcement", label: "General Announcement" },
];

const templates = {
  enrollment_confirmation: "Your enrollment has been confirmed. Please log in and update your password on first login.",
  fee_reminder: "Please remember to clear any outstanding fees. Contact the office for assistance.",
  general_announcement: "Announcement: ",
};

const SecretaryNotifications = () => {
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [form, setForm] = useState({
    type: "general_announcement",
    title: "Announcement",
    message: templates.general_announcement,
  });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadStudents = async (searchTerm) => {
    setLoadingStudents(true);
    try {
      const all = [];
      let page = 1;
      let total = 0;

      do {
        // eslint-disable-next-line no-await-in-loop
        const res = await makeRequest.get("/secretary/students", {
          params: { search: searchTerm || undefined, limit: 100, page },
        });

        const batch = res.data.students || [];
        total = Number(res.data.total || 0);
        all.push(...batch);
        page += 1;

        // Safety cap: avoid endless pagination if total is inconsistent
        if (page > 100) break; // up to 10,000 rows
      } while (all.length < total);

      // Deduplicate by student_id (defensive)
      const map = new Map();
      all.forEach((s) => map.set(s.student_id, s));
      setStudents(Array.from(map.values()));
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const searchStudents = async () => loadStudents(studentSearch.trim());

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await makeRequest.get("/secretary/notifications", { params: { page: 1, limit: 20 } });
      setHistory(res.data.notifications || []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadStudents("");
  }, []);

  useEffect(() => {
    setForm((p) => ({
      ...p,
      message: templates[p.type] || "",
      title: p.type === "fee_reminder" ? "Fee Reminder" : p.type === "enrollment_confirmation" ? "Enrollment Confirmation" : "Announcement",
    }));
  }, [form.type]);

  const send = async () => {
    if (!selectedStudent) return toast.error("Select a student");
    try {
      await makeRequest.post(`/secretary/students/${selectedStudent}/notifications`, form);
      toast.success("Notification sent");
      await loadHistory();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to send");
    }
  };

  return (
    <SecretaryShell
      title="Notifications"
      subtitle="Send in-app notifications to students (no email) and view notification history."
    >
      <Toaster position="top-right" />

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Send Notification</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3 md:items-end">
          <div className="md:col-span-1">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Find student</span>
              <div className="flex gap-2">
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search name/reg/email..."
                  className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
                />
                <button
                  onClick={searchStudents}
                  className="rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Search
                </button>
              </div>
            </label>
            <label className="mt-3 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Student</span>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.full_name} ({s.reg_no})
                  </option>
                ))}
              </select>
              {loadingStudents ? (
                <div className="mt-2 text-xs font-semibold text-slate-500">Loading students...</div>
              ) : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Message</span>
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
          />
        </label>

        <div className="mt-4 flex justify-end">
          <button
            onClick={send}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Send
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Notification History</h2>
        <div className="mt-4 overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
          <table className="min-w-full">
            <thead className="bg-slate-100/80">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loadingHistory ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">No notifications yet.</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="bg-white">
                    <td className="px-5 py-4 text-sm text-slate-600">{h.created_at ? new Date(h.created_at).toLocaleString() : ""}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{h.student_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{h.type}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{String(h.message || "").slice(0, 90)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </SecretaryShell>
  );
};

export default SecretaryNotifications;
