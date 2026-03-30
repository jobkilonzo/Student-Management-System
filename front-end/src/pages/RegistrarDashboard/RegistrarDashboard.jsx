// src/pages/RegistrarDashboard/RegistrarDashboard.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { makeRequest } from "../../../axios";
import RegistrarActionCard from "./RegistrarActionCard";

const RegistrarDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCourses: 0,
    activeStudents: 0,
    units: 0,
    pendingApprovals: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await makeRequest.get("/registrar/courses/dashboard");
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const checkTutor = async () => {
      try {
        const res = await makeRequest.get(
          "/registrar/unit-assignments/check-is-tutor"
        );
        setIsTutor(res.data.isTutor);
      } catch (err) {
        console.error(err);
      }
    };
    checkTutor();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen space-y-10 bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_35%,_#f8fafc_78%)] p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Registrar Dashboard
          </h1>
          <p className="mt-1 text-sm text-sky-900/70">
            Manage courses, students, and academic operations
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
        >
          Logout
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="flex items-center gap-4 rounded-[28px] border border-sky-200 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 text-white shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
          👤
        </div>
        <div>
          <h2 className="text-lg font-semibold">Welcome back, Registrar</h2>
          <p className="text-sm opacity-90">
            {loading
              ? "Loading dashboard insights..."
              : `${stats.pendingApprovals} pending registrations need review.`}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <RegistrarActionCard
            label="Manage Courses"
            to="/registrar/courses"
            description="Maintain course structure, codes, and the unit setup for each programme."
            icon="📚"
          />
          <RegistrarActionCard
            label="Manage Students"
            to="/registrar/students"
            description="Review student records, edit details, and transition learners across modules and terms."
            icon="🎓"
          />
          <RegistrarActionCard
            label="View Reports"
            to="/registrar/reports"
            description="Track enrollment, distribution, and academic reporting from a central analytics page."
            icon="📄"
          />
          <RegistrarActionCard
            label="Assign Units"
            to="/registrar/assign-units"
            description="Allocate units to tutors and control marks-entry permissions with confidence."
            icon="🧑‍🏫"
          />
          <RegistrarActionCard
            label="Generate Transcript"
            to="/registrar/transcript"
            description="Prepare institutional transcripts with cleaner presentation and downloadable output."
            icon="📜"
          />
          {isTutor && (
            <RegistrarActionCard
              label="Tutor Dashboard"
              to="/tutor/dashboard"
              description="Open your tutor workspace directly when you also serve in teaching responsibilities."
              icon="👨‍🏫"
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon="📊"
            title="Total Courses"
            value={stats.totalCourses}
            loading={loading}
          />
          <StatCard
            icon="👥"
            title="Active Students"
            value={stats.activeStudents}
            loading={loading}
          />
          <StatCard
            icon="📝"
            title="Units"
            value={stats.units}
            loading={loading}
          />
          <StatCard
            icon="⏳"
            title="Pending Approvals"
            value={stats.pendingApprovals}
            highlight
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

/* Improved Stat Card with Icon Styling */
const StatCard = ({ icon, title, value, highlight, loading }) => {
  return (
    <div className="rounded-3xl border border-sky-100 bg-white/95 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-sky-900/65">{title}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-xl text-sky-700">
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 h-8 w-16 animate-pulse rounded bg-sky-100" />
      ) : (
        <h2
          className={`text-3xl font-semibold mt-4 ${
            highlight ? "text-amber-500" : "text-slate-900"
          }`}
        >
          {value}
        </h2>
      )}
    </div>
  );
};

export default RegistrarDashboard;
