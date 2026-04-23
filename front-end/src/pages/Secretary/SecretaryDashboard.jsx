import { useEffect, useMemo, useState } from "react";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";

const SecretaryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await makeRequest.get("/secretary/dashboard");
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load secretary dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const courseSummary = useMemo(() => data?.students_by_course || [], [data]);

  return (
    <SecretaryShell
      title="Secretary Dashboard"
      subtitle="Create student accounts, manage enrollment details, send notifications, and export reports."
    >
      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-slate-600 shadow-sm">
          Loading dashboard...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard label="Total Students" value={data?.stats?.total_students || 0} tone="text-slate-900" />
            <StatCard label="Recent Enrollments (7 days)" value={(data?.recent_enrollments || []).length} tone="text-sky-700" />
            <StatCard label="Recent Activities" value={(data?.recent_activity || []).length} tone="text-cyan-700" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Students by Course</h2>
              <div className="mt-4 space-y-3">
                {courseSummary.length === 0 ? (
                  <div className="text-slate-500">No data yet.</div>
                ) : (
                  courseSummary.slice(0, 8).map((c) => (
                    <div key={c.course_name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="font-semibold text-slate-800">{c.course_name}</div>
                      <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                        {c.count}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Recent Enrollments</h2>
              <div className="mt-4 space-y-3">
                {(data?.recent_enrollments || []).slice(0, 8).map((s) => (
                  <div key={s.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {s.reg_no} • {s.course_name || "—"}
                    </div>
                  </div>
                ))}
                {(data?.recent_enrollments || []).length === 0 ? (
                  <div className="text-slate-500">No recent enrollments.</div>
                ) : null}
              </div>
            </section>
          </div>

         
        </div>
      )}
    </SecretaryShell>
  );
};

const StatCard = ({ label, value, tone }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
    <p className={`mt-3 text-4xl font-black ${tone}`}>{value}</p>
  </div>
);

export default SecretaryDashboard;

