import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import NotificationsWidget from "../../components/NotificationsWidget";
import StudentPortalLayout from "./StudentPortalLayout";

const StatCard = ({ label, value, tone }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
  </div>
);

const ActionCard = ({ title, desc, route, tone }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(route)}
      className={`w-full rounded-3xl bg-gradient-to-br ${tone} p-6 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl`}
    >
      <p className="text-xl font-bold">{title}</p>
      <p className="mt-2 text-sm text-white/85">{desc}</p>
    </button>
  );
};

const StudentDashboardPro = () => {
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const [studentRes, marksRes] = await Promise.all([
          makeRequest.get("/student/profile"),
          makeRequest.get("/student/results"),
        ]);
        setStudent(studentRes.data);
        setMarks(Array.isArray(marksRes.data) ? marksRes.data : marksRes.data?.data || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const average = useMemo(() => {
    if (!marks.length) return "N/A";
    return (marks.reduce((sum, mark) => sum + Number(mark.total || 0), 0) / marks.length).toFixed(2);
  }, [marks]);

  const best = useMemo(() => {
    if (!marks.length) return "N/A";
    return Math.max(...marks.map((mark) => Number(mark.total || 0)));
  }, [marks]);

  const cards = [
    {
      title: "Update Details",
      desc: "Edit your personal information and contact details.",
      route: "/student/update-details",
      tone: "from-sky-600 via-sky-700 to-cyan-700",
    },
    {
      title: "Assigned Units",
      desc: "Review your active learning units and course structure.",
      route: "/student/units",
      tone: "from-sky-500 via-cyan-600 to-sky-700",
    },
    {
      title: "Fee Balance",
      desc: "Track fees paid, current balance, and receipt access.",
      route: "/student/fees",
      tone: "from-cyan-500 via-sky-600 to-sky-700",
    },
    {
      title: "Results",
      desc: "Check marks, grades, and finalized academic outcomes.",
      route: "/student/results",
      tone: "from-sky-700 via-cyan-600 to-sky-500",
    },
  ];

  return (
    <StudentPortalLayout
      title="Student Dashboard"
      subtitle="Stay on top of your academic progress, profile details, fees, and recent results from one professional student portal."
      backTo={null}
      actions={
        <div className="flex justify-end">
          <div className="relative">
            <NotificationsWidget />
            {student?.unread_notifications > 0 && (
              <span className="absolute top-0 right-0 inline-block h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
            )}
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading dashboard...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Student Profile</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {student?.first_name} {student?.last_name}
              </h2>
              <p className="mt-2 text-slate-600">Reg No: {student?.reg_no || "Not available"}</p>
              <p className="text-slate-600">
                Course: {student?.course_name || "Not assigned"}
                {student?.course_code ? ` (${student.course_code})` : ""}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard label="Units Completed" value={marks.length} tone="text-blue-700" />
              <StatCard label="Average Score" value={average === "N/A" ? average : `${average}%`} tone="text-emerald-700" />
              <StatCard label="Best Score" value={best} tone="text-violet-700" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <ActionCard key={card.route} {...card} />
            ))}
          </div>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Recent Results</h3>
                <p className="text-sm text-slate-500">A quick look at your latest recorded academic performance.</p>
              </div>
            </div>

            {marks.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No results available yet.</div>
            ) : (
              <div className="space-y-3">
                {marks.slice(0, 5).map((mark, index) => (
                  <div
                    key={`${mark.unit_code}-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{mark.unit_code}</p>
                      <p className="text-sm text-slate-500">{mark.unit_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-700">{mark.total ?? "-"}</p>
                      <p className="text-sm text-slate-500">Grade: {mark.grade || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </StudentPortalLayout>
  );
};

export default StudentDashboardPro;
