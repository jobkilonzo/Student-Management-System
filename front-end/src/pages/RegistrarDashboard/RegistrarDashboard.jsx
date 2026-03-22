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
  const [assignedTutors, setAssignedTutors] = useState([]); // new state

  // Fetch dashboard stats from backend
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

  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    const checkTutor = async () => {
      try {
        const res = await makeRequest.get("/registrar/unit-assignments/check-is-tutor");
        setIsTutor(res.data.isTutor);
      } catch (err) {
        console.error(err);
      }
    };
    checkTutor();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sms_token"); // match axios instance key
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header & Logout */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Registrar Dashboard
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Manage courses, units, students, and their registrations.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-red-200"
        >
          <span className="text-xl group-hover:scale-110 transition-transform duration-300">🚪</span>
          <span className="font-medium text-gray-700 group-hover:text-red-600 transition-colors duration-300">
            Logout
          </span>
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="mb-8 bg-white rounded-2xl shadow-sm p-6 border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
            👤
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Welcome back, Registrar!
            </h2>
            <p className="text-gray-600">
              {loading
                ? "Loading dashboard stats..."
                : `You have ${stats.pendingApprovals} pending registrations to review today.`}
            </p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          description="View courses, units, and student details."
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
          description="Generate full student transcripts."
          icon="📜"
        />
        {isTutor && (
          <PortalItem
            label="Tutor Dashboard"
            to="/tutor/dashboard"
            description="Access your tutor dashboard and assigned units."
            icon="👨‍🏫"
          />
        )}

      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm text-gray-600">Total Courses</div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalCourses}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-sm text-gray-600">Active Students</div>
          <div className="text-2xl font-bold text-gray-800">{stats.activeStudents}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-sm text-gray-600">Units</div>
          <div className="text-2xl font-bold text-gray-800">{stats.units}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm text-gray-600">Pending Approvals</div>
          <div className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarDashboard;