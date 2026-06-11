import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";

const tabs = ["personal", "enrollment", "units", "notifications"];

const SecretaryStudentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tab, setTab] = useState("personal");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const student = data?.student;
  const units = data?.units || [];
  const notifications = data?.notifications || [];

  const fullName = useMemo(() => {
    if (!student) return "";
    return [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
  }, [student]);

  const reload = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get(`/secretary/students/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load student");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const assignUnits = async () => {
    setBusy(true);
    try {
      const res = await makeRequest.post(`/secretary/students/${id}/assign-units`);
      toast.success(`Assigned ${res.data.assigned || 0} units`);
      await reload();
      setTab("units");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to assign units");
    } finally {
      setBusy(false);
    }
  };

  const sendFeeReminder = async () => {
    setBusy(true);
    try {
      await makeRequest.post(`/secretary/fee-reminder/${id}`);
      toast.success("Reminder sent");
      await reload();
      setTab("notifications");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to send reminder");
    } finally {
      setBusy(false);
    }
  };

  const sendNotification = async () => {
    const type = window.prompt("Type (enrollment_confirmation / fee_reminder / general_announcement):", "general_announcement");
    if (!type) return;
    const title = window.prompt("Title:", "Announcement");
    if (!title) return;
    const message = window.prompt("Message:");
    if (!message) return;

    setBusy(true);
    try {
      await makeRequest.post(`/secretary/students/${id}/notifications`, { type, title, message });
      toast.success("Notification sent");
      await reload();
      setTab("notifications");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to send notification");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SecretaryShell title="Student Detail" subtitle="View student details, enrollment, assigned units, and notifications history.">
      <Toaster position="top-right" />

      <button
        onClick={() => navigate("/secretary/students")}
        className="w-fit rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        ← Back to students
      </button>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-slate-600 shadow-sm">Loading…</div>
      ) : !student ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">Student not found.</div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Student</div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{fullName}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {student.reg_no} • {student.course_name || "—"} • Module {student.module ?? "—"} • Term {student.term ?? "—"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={assignUnits}
                  disabled={busy}
                  className="rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
                >
                  Assign Units
                </button>
                <button
                  onClick={sendNotification}
                  disabled={busy}
                  className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  Send Notification
                </button>
                <button
                  onClick={sendFeeReminder}
                  disabled={busy}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  Send Fee Reminder
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-2 shadow-sm">
            <div className="flex flex-wrap gap-2 p-4">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    tab === t ? "bg-sky-100 text-sky-800" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {tab === "personal" ? (
            <InfoCard title="Personal Info">
              <KeyVal label="Reg No" value={student.reg_no} />
              <KeyVal label="Email" value={student.email} />
              <KeyVal label="Phone" value={student.phone || "—"} />
              <KeyVal label="Gender" value={student.gender} />
              <KeyVal label="DOB" value={student.dob ? String(student.dob).slice(0, 10) : "—"} />
              <KeyVal label="ID Number" value={student.id_number || "—"} />
              <KeyVal label="Address" value={student.address || "—"} />
            </InfoCard>
          ) : null}

          {tab === "enrollment" ? (
            <InfoCard title="Enrollment">
              <KeyVal label="Course" value={student.course_name || "—"} />
              <KeyVal label="Module" value={student.module ?? "—"} />
              <KeyVal label="Term" value={student.term ?? "—"} />
              <div className="mt-3 text-sm text-slate-600">
                Course changes are allowed via the Edit action from the student list (limited fields).
              </div>
            </InfoCard>
          ) : null}

          {tab === "units" ? (
            <InfoCard title="Assigned Units">
              {units.length === 0 ? (
                <div className="text-slate-500">No units assigned yet.</div>
              ) : (
                <div className="overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
                  <table className="min-w-full">
                    <thead className="bg-slate-100/80">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {units.map((u) => (
                        <tr key={u.unit_id} className="bg-white">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">{u.unit_name}</div>
                            <div className="text-sm text-slate-500">{u.unit_code}</div>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={u.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </InfoCard>
          ) : null}

          {tab === "notifications" ? (
            <InfoCard title="Notifications">
              {notifications.length === 0 ? (
                <div className="text-slate-500">No notifications sent to this student yet.</div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold text-slate-900">{n.title}</div>
                        <div className="text-xs text-slate-500">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</div>
                      </div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{n.type}</div>
                      <div className="mt-2 text-sm text-slate-700">{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </InfoCard>
          ) : null}
        </div>
      )}
    </SecretaryShell>
  );
};

const InfoCard = ({ title, children }) => (
  <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <div className="mt-4 space-y-3">{children}</div>
  </section>
);

const KeyVal = ({ label, value }) => (
  <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const cleanStatus = String(status || "").trim();

  const styles = {
    Pending: "bg-slate-100 text-slate-700",
    "In Progress": "bg-amber-100 text-amber-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Active: "bg-sky-100 text-sky-700",
  };


  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[cleanStatus] || styles.Pending
      }`}
    >
      {cleanStatus || "Pending"}
    </span>
  );
};

export default SecretaryStudentDetail;
