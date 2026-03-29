import { useNavigate } from "react-router-dom";

const ExamOfficerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="bg-white rounded-xl shadow-md p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Examination Officer Dashboard</h1>
          <button
            onClick={() => navigate("/login")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Manage exam timetables, mark reviews and results release.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="bg-blue-50 border border-blue-200 rounded-lg p-5 cursor-pointer hover:border-blue-400"
            onClick={() => navigate("/exam-officer/manage-exams")}
          >
            <h2 className="text-xl font-semibold">Manage Exams</h2>
            <p className="text-gray-600">Create/update exam schedules and grading sessions.</p>
          </div>

          <div
            className="bg-blue-50 border border-blue-200 rounded-lg p-5 cursor-pointer hover:border-blue-400"
            onClick={() => navigate("/exam-officer/review-marks")}
          >
            <h2 className="text-xl font-semibold">Review Marks</h2>
            <p className="text-gray-600">Approve or query tutor-entered marks before release.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamOfficerDashboard;
