import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const TutorDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({ name: "Loading..." });
  const [stats, setStats] = useState({
    classesToday: 0,
    totalStudents: 0,
    assignmentsDue: 0,
    avgAttendance: "0%",
  });
  const [schedule, setSchedule] = useState([]);
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Safe Tailwind color mapping
  const bgMap = { red: "bg-red-50", blue: "bg-blue-50", green: "bg-green-50", yellow: "bg-yellow-50", gray: "bg-gray-50" };
  const textMap = { red: "text-red-700", blue: "text-blue-700", green: "text-green-700", yellow: "text-yellow-700", gray: "text-gray-700" };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const userRes = await makeRequest.get("/auth/me");
        setUser(userRes.data.user || { name: "Unknown" });
      } catch (err) {
        setUser({ name: "Unknown" });
      }

      try {
        const unitsRes = await makeRequest.get("/tutor/assigned-units");
        setAssignedUnits(Array.isArray(unitsRes.data.units) ? unitsRes.data.units : []);
      } catch (err) {
        setAssignedUnits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Navigation handlers
  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    navigate("/login");
  };
  const handleMarkAttendance = () => navigate("/tutor/attendance");
  const handleEnterMarks = () => navigate("/tutor/marks");
  const handleAssignments = () => navigate("/tutor/assignments");
  const handleProgressReports = () => navigate("/tutor/reports");

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
        <div className="text-xl font-medium animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Tutor Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Welcome back, {user?.name}! Manage your classes, attendance, and student assessments.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{value}</div>
              <div className="text-slate-600">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
            {schedule.length === 0 ? (
              <p className="text-slate-500">No classes scheduled for today.</p>
            ) : (
              <div className="space-y-4">
                {schedule.map((cls, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-4 p-3 rounded-lg ${bgMap[cls.color] || "bg-gray-50"}`}
                  >
                    <div className={`text-sm font-medium ${textMap[cls.color] || "text-gray-700"}`}>
                      {cls.time}
                    </div>
                    <div>
                      <div className="font-medium">{cls.subject}</div>
                      <div className="text-sm text-slate-600">{cls.room} - {cls.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Units */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Assigned Units</h2>
            {assignedUnits.length === 0 ? (
              <p className="text-slate-500">No units assigned yet.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {assignedUnits.map((unit, idx) => (
                  <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{unit.unit_name}</div>
                      <div className="text-sm text-slate-600">{unit.course_name}</div>
                    </div>
                    <div className="text-sm text-slate-500">{unit.module}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Teaching Tools */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <button onClick={handleMarkAttendance} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-left">
            <div className="font-medium text-blue-700">📝 Mark Attendance</div>
            <div className="text-sm text-slate-600">Record class attendance</div>
          </button>
          <button onClick={handleEnterMarks} className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-left">
            <div className="font-medium text-green-700">📊 Enter Marks</div>
            <div className="text-sm text-slate-600">CAT and exam marks</div>
          </button>
          <button onClick={handleAssignments} className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-left">
            <div className="font-medium text-purple-700">📅 Assignments</div>
            <div className="text-sm text-slate-600">Create and grade</div>
          </button>
          <button onClick={handleProgressReports} className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition text-left">
            <div className="font-medium text-orange-700">📈 Progress Reports</div>
            <div className="text-sm text-slate-600">Student performance</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;