import { useNavigate } from "react-router-dom";
import PortalItem from "../../components/PortalItem";

const ClassAttendanceManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 w-full min-h-screen bg-slate-50">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-slate-700 font-medium hover:text-blue-600 transition flex items-center space-x-2"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Class Attendance Management
        </h1>
        <p className="text-gray-600 mt-2">
          Track student attendance, generate reports, and monitor class participation.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-blue-700">📝 Daily Attendance</h3>
          <p className="text-sm text-gray-600 mt-2">
            Mark daily attendance for each class and unit.
          </p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-green-700">📊 Attendance Summary</h3>
          <p className="text-sm text-gray-600 mt-2">
            View attendance percentages and trends.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-purple-700">🚨 Absentee Alerts</h3>
          <p className="text-sm text-gray-600 mt-2">
            Identify students with low attendance.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-orange-700">📁 Reports</h3>
          <p className="text-sm text-gray-600 mt-2">
            Generate printable attendance reports.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PortalItem
          label="Mark Attendance"
          to="/class-attendance-management/attendance/mark"
          description="Record daily class attendance."
          icon="📝"
        />

        <PortalItem
          label="Attendance Records"
          to="/attendance/records"
          description="View attendance history by class or unit."
          icon="📊"
        />

        <PortalItem
          label="Low Attendance"
          to="/attendance/alerts"
          description="Identify students below required attendance."
          icon="🚨"
        />

        <PortalItem
          label="Attendance Reports"
          to="/attendance/reports"
          description="Download and print attendance summaries."
          icon="📁"
        />
      </div>
    </div>
  );
};

export default ClassAttendanceManagement;