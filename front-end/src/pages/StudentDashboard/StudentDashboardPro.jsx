import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BellIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  IdentificationIcon,
  PencilSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { makeRequest } from "../../../axios";
import NotificationsWidget from "../../components/NotificationsWidget";
import StudentPortalLayout from "./StudentPortalLayout";

const StatCard = ({ label, value, description, icon: Icon, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className="mt-3 text-sm text-slate-500">{description}</p>
  </div>
);

const ActionCard = ({ title, desc, route, icon: Icon, accent }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(route)}
      className="group flex h-full w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-slate-950">{title}</p>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-700" />
        </div>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{desc}</p>
      </div>
    </button>
  );
};

const getGradeTone = (grade) => {
  const normalized = String(grade || "").toUpperCase();
  if (normalized.startsWith("A")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized.startsWith("B")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (normalized.startsWith("C")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (normalized) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
};

const StudentDashboardPro = () => {
  const navigate = useNavigate();
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

  const firstName = student?.first_name || "Student";
  const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(" ") || "Student";

  const latestResults = useMemo(() => marks.slice(0, 5), [marks]);
  const passedUnits = useMemo(
    () => marks.filter((mark) => Number(mark.total || 0) >= 50).length,
    [marks]
  );

  const cards = [
    {
      title: "Update Details",
      desc: "Keep your personal information and contact details current.",
      route: "/student/update-details",
      icon: PencilSquareIcon,
      accent: "bg-sky-50 text-sky-700",
    },
    {
      title: "Assigned Units",
      desc: "Review your active learning units and course structure.",
      route: "/student/units",
      icon: AcademicCapIcon,
      accent: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Fee Balance",
      desc: "Track fees paid, current balance, and receipt access.",
      route: "/student/fees",
      icon: BanknotesIcon,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Results",
      desc: "Check marks, grades, and finalized academic outcomes.",
      route: "/student/results",
      icon: ChartBarIcon,
      accent: "bg-violet-50 text-violet-700",
    },
    {
      title: "Exam Card",
      desc: "View your exam card for the current TERM after clearance.",
      route: "/student/exam-card",
      icon: IdentificationIcon,
      accent: "bg-amber-50 text-amber-700",
    },
    {
      title: "My Transcript",
      desc: "Generate and download your academic transcript for any term.",
      route: "/student/transcript",
      icon: DocumentTextIcon,
      accent: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <StudentPortalLayout
      title="Student Dashboard"
      subtitle="Stay on top of your academic progress, profile details, fees, and recent results from one professional student portal."
      backTo={null}
      actions={
        <div className="flex justify-end">
          <div className="relative rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
            <NotificationsWidget />
            {student?.unread_notifications > 0 && (
              <span className="absolute right-0 top-0 inline-block h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
            )}
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      ) : (
        <div className="space-y-7">
          <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student Profile</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-xl font-semibold text-sky-800">
                    {firstName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-semibold text-slate-950">{fullName}</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Registration</p>
                        <p className="mt-1 font-medium text-slate-900">{student?.reg_no || "Not available"}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Course</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {student?.course_name || "Not assigned"}
                          {student?.course_code ? ` (${student.course_code})` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <StatCard
                label="Recorded Units"
                value={marks.length}
                description={`${passedUnits} with passing scores`}
                icon={ClipboardDocumentCheckIcon}
                tone="bg-sky-50 text-sky-700"
              />
              <StatCard
                label="Average Score"
                value={average === "N/A" ? average : `${average}%`}
                description="Calculated from available results"
                icon={SparklesIcon}
                tone="bg-emerald-50 text-emerald-700"
              />
              <StatCard
                label="Best Score"
                value={best === "N/A" ? best : `${best}%`}
                description="Highest recorded total"
                icon={CheckBadgeIcon}
                tone="bg-violet-50 text-violet-700"
              />
            </div>
          </div>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Quick Actions</h3>
                <p className="mt-1 text-sm text-slate-500">Open the student services you use most often.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                <BellIcon className="h-4 w-4" />
                Portal services
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <ActionCard key={card.route} {...card} />
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Recent Results</h3>
                <p className="text-sm text-slate-500">A quick look at your latest recorded academic performance.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/student/results")}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                View All
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>

            {marks.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No results available yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {latestResults.map((mark, index) => (
                  <div
                    key={`${mark.unit_code}-${index}`}
                    className="grid gap-3 px-5 py-4 transition hover:bg-sky-50/40 md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">{mark.unit_code || "Unit"}</p>
                      <p className="text-sm text-slate-500">{mark.unit_name}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 md:text-right">
                      Score: <span className="text-slate-950">{mark.total ?? "-"}</span>
                    </p>
                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getGradeTone(mark.grade)}`}>
                      Grade {mark.grade || "-"}
                    </span>
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
