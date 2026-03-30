import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const TutorDashboardPro = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Loading..." });
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await makeRequest.get("/auth/me");
        const userData = response.data;
        const fullName = [userData?.user?.first_name, userData?.user?.middle_name, userData?.user?.last_name]
          .filter(Boolean)
          .join(" ");
        setUser({ name: fullName || userData?.user?.first_name || "Tutor" });
      } catch (err) {
        setUser({ name: "Tutor" });
      }

      try {
        const unitsRes = await makeRequest.get("/tutor/assigned-units");
        setAssignedUnits(Array.isArray(unitsRes.data.units) ? unitsRes.data.units : []);
      } catch (err) {
        console.error("Failed to load assigned units:", err);
        setAssignedUnits([]);
        setError("Failed to load tutor dashboard information.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    const unitCount = assignedUnits.length;
    const courseCount = new Set(assignedUnits.map((unit) => unit.course_name).filter(Boolean)).size;
    const moduleCount = new Set(assignedUnits.map((unit) => unit.module).filter(Boolean)).size;

    return {
      assignedUnits: unitCount,
      activeCourses: courseCount,
      moduleCoverage: moduleCount,
      marksWorkspace: unitCount > 0 ? "Ready" : "Pending",
    };
  }, [assignedUnits]);

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    navigate("/login");
  };

  const toolCards = [
    {
      title: "Enter Marks",
      desc: "Open the assessment workspace and record CAT and exam marks by assigned unit.",
      route: "/tutor/marks",
      tone: "from-sky-600 via-sky-700 to-cyan-700",
    },
    {
      title: "Attendance",
      desc: "Review attendance tools and keep class participation records organized.",
      route: "/tutor/attendance",
      tone: "from-cyan-500 via-sky-600 to-sky-700",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
        <div className="rounded-3xl border border-sky-100 bg-white px-8 py-6 text-lg font-medium text-slate-600 shadow-sm">
          Loading tutor dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <section className="relative overflow-hidden rounded-[30px] border border-sky-200/80 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(14,116,144,0.58)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.25),_transparent_32%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-50">
                Teaching Workspace
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">Tutor Dashboard</h1>
                <p className="mt-3 max-w-2xl text-sm text-sky-50/90 sm:text-base">
                  Welcome back, {user?.name}. Manage your assigned teaching units, move quickly into marks entry,
                  and keep your academic work in one professional portal.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/tutor/marks")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-800 shadow-lg transition hover:bg-sky-50"
              >
                Open Marks Workspace
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned Units" value={stats.assignedUnits} tone="text-sky-700" />
          <StatCard label="Active Courses" value={stats.activeCourses} tone="text-cyan-700" />
          <StatCard label="Module Coverage" value={stats.moduleCoverage} tone="text-sky-700" />
          <StatCard label="Marks Workspace" value={stats.marksWorkspace} tone="text-cyan-700" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="mb-6">
              <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                Teaching Tools
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Quick actions</h2>
              <p className="mt-2 text-sm text-slate-600">
                Move directly into the key tutor workflows you use most often.
              </p>
            </div>

            <div className="grid gap-4">
              {toolCards.map((card) => (
                <button
                  key={card.route}
                  onClick={() => navigate(card.route)}
                  className={`rounded-3xl bg-gradient-to-br ${card.tone} p-6 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl`}
                >
                  <p className="text-xl font-bold">{card.title}</p>
                  <p className="mt-2 text-sm text-white/85">{card.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                  Assigned Units
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Current teaching load</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Review the active course and module combinations currently attached to your account.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                <span className="font-semibold">{assignedUnits.length}</span> units assigned
              </div>
            </div>

            {assignedUnits.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                No units assigned yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <div className="overflow-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-100/80">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Module</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {assignedUnits.map((unit, idx) => (
                        <tr key={`${unit.unit_id}-${idx}`} className="bg-white transition hover:bg-sky-50/60">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">{unit.unit_name}</p>
                            {unit.unit_code ? <p className="text-sm text-slate-500">{unit.unit_code}</p> : null}
                          </td>
                          <td className="px-5 py-4 text-slate-700">{unit.course_name || "-"}</td>
                          <td className="px-5 py-4 text-slate-700">{unit.module || unit.term || "-"}</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => navigate("/tutor/marks")}
                              className="rounded-xl bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
                            >
                              Enter Marks
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
  </div>
);

export default TutorDashboardPro;
