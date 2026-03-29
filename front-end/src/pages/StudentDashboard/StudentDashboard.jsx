import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import NotificationsWidget from "../../components/NotificationsWidget";

// ---------- Stat Component ----------
const Stat = ({ label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition text-center">
    <p className="text-gray-500 text-sm">{label}</p>
    <h2 className={`text-3xl font-bold ${color}`}>{value}</h2>
  </div>
);

// ---------- Dashboard Card Component ----------
const DashboardCard = ({ title, desc, route, color }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(route)}
      className={`cursor-pointer text-white p-6 rounded-2xl shadow-lg bg-gradient-to-r ${color} 
                 hover:scale-105 transform transition-transform duration-300 flex flex-col justify-between`}
    >
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm opacity-90 mt-1">{desc}</p>
      </div>
    </div>
  );
};

// ---------- Stats Section ----------
const StatsSection = ({ marks }) => {
  const average = useMemo(() => {
    if (!marks.length) return "N/A";
    return (marks.reduce((sum, m) => sum + Number(m.total || 0), 0) / marks.length).toFixed(2);
  }, [marks]);

  const best = useMemo(() => {
    if (!marks.length) return "N/A";
    return Math.max(...marks.map((m) => Number(m.total || 0)));
  }, [marks]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
      <Stat label="Units Completed" value={marks.length} color="text-blue-600" />
      <Stat label="Average Score" value={`${average}%`} color="text-green-600" />
      <Stat label="Best Score" value={best} color="text-purple-600" />
    </div>
  );
};

// ---------- Recent Results ----------
const RecentResults = ({ marks }) => {
  const navigate = useNavigate();
  const recent = marks.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 overflow-auto max-h-[400px] mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Results</h3>
      {marks.length === 0 ? (
        <p className="text-gray-500">No results available yet.</p>
      ) : (
        <div className="space-y-3">
          {recent.map((m, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-800">{m.unit_code}</p>
                <p className="text-sm text-gray-500">{m.unit_name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">{m.total ?? "-"}</p>
                <p className="text-sm text-gray-500">Grade: {m.grade || "-"}</p>
              </div>
            </div>
          ))}
          {marks.length > 5 && (
            <button
              onClick={() => navigate("/student/results")}
              className="text-blue-600 underline mt-2"
            >
              View All Results
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ---------- Main Dashboard ----------
const StudentDashboard = () => {
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
        setMarks(marksRes.data || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    navigate("/login");
  };

  const cards = [
    { title: "Update Details", desc: "Edit your personal info", route: "/student/update-details", color: "from-blue-500 to-blue-700" },
    { title: "Units", desc: "View assigned units", route: "/student/units", color: "from-green-500 to-green-700" },
    { title: "Fees", desc: "Check fee balance", route: "/student/fees", color: "from-yellow-500 to-yellow-600" },
    { title: "Results", desc: "View academic results", route: "/student/results", color: "from-purple-500 to-purple-700" },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500 animate-pulse text-lg">Loading dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 px-4 py-2 rounded-lg text-white"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ---------- HEADER ---------- */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex justify-between items-center max-w-6xl mx-auto gap-4 flex-wrap">
          {/* Page Title */}
          <h1 className="text-3xl font-bold">Student Dashboard</h1>

          {/* Notifications & Logout */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <NotificationsWidget />
              {student?.unread_notifications > 0 && (
                <span className="absolute top-0 right-0 inline-block w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg shadow transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="max-w-6xl mx-auto p-6 relative space-y-6">

        {/* Student Info in main section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{student?.first_name} {student?.last_name}</h2>
            <p className="text-gray-500 mt-1">Reg No: {student?.reg_no}</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => <DashboardCard key={i} {...card} />)}
        </div>

        {/* Stats */}
        <StatsSection marks={marks} />

        {/* Recent Results */}
        <RecentResults marks={marks} />

      </main>
    </div>
  );
};

export default StudentDashboard;