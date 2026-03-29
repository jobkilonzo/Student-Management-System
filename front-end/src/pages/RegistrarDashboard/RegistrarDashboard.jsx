// src/pages/RegistrarDashboard/RegistrarDashboard.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { makeRequest } from "../../../axios";
import PortalItem from "../../components/PortalItem";

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
    <div className="p-6 min-h-screen bg-gray-50 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Registrar Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage courses, students, and academic operations
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 transition"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl text-2xl">
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PortalItem
            label="Manage Courses"
            to="/registrar/courses"
            description="Add courses and define units."
            icon="📚"
          />
          <PortalItem
            label="Manage Students"
            to="/registrar/students"
            description="Add students and assign courses."
            icon="🎓"
          />
          <PortalItem
            label="View Reports"
            to="/registrar/reports"
            description="View courses and analytics."
            icon="📄"
          />
          <PortalItem
            label="Assign Units"
            to="/registrar/assign-units"
            description="Assign units to tutors."
            icon="🧑‍🏫"
          />
          <PortalItem
            label="Generate Transcript"
            to="/registrar/transcript"
            description="Generate student transcripts."
            icon="📜"
          />
          {isTutor && (
            <PortalItem
              label="Tutor Dashboard"
              to="/tutor/dashboard"
              description="Access your tutor panel."
              icon="👨‍🏫"
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="text-xl bg-gray-100 w-10 h-10 flex items-center justify-center rounded-lg">
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-4" />
      ) : (
        <h2
          className={`text-3xl font-semibold mt-4 ${
            highlight ? "text-amber-500" : "text-gray-900"
          }`}
        >
          {value}
        </h2>
      )}
    </div>
  );
};

export default RegistrarDashboard;