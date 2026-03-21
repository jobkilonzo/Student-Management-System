import { useNavigate } from "react-router-dom";
import PortalItem from "../components/PortalItem";

const ExamManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 w-full min-h-screen">
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
          Exam Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage examination schedules, CATs, end-term exams, and final results.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-blue-700">
            📅 Timetables
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Create and publish official exam schedules.
          </p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-green-700">
            📝 CAT Marks
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Record Continuous Assessment Test marks (30%).
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-purple-700">
            📊 End-Term Exams
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Capture end-term examination marks (70%).
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-orange-700">
            ✅ Final Results
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Combine CAT + End-Term for final score (100%).
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PortalItem
          label="Exam Timetable"
          to="/exam-management/timetable"
          description="Prepare and publish official exam schedules."
          icon="📅"
        />

        <PortalItem
          label="CAT Marks Entry"
          to="/exam-management/cat-marks"
          description="Capture CAT scores per unit and student."
          icon="📝"
        />

        <PortalItem
          label="End-Term Marks"
          to="/exam-management/endterm-marks"
          description="Enter and manage end-term examination marks."
          icon="📊"
        />

        <PortalItem
          label="Final Results"
          to="/exam-management/final-results"
          description="View combined CAT (30) and End-Term (70) results."
          icon="✅"
        />
      </div>
    </div>
  );
};

export default ExamManagement;