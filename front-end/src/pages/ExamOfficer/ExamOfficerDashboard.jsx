import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const ExamOfficerDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await makeRequest.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("sms_token");
      localStorage.removeItem("sms_role");
      localStorage.removeItem("sms_user");
      localStorage.removeItem("sms_must_change_password");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Examination Officer Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigate("/account")}
              className="w-full sm:w-auto bg-white text-slate-800 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              My Account
            </button>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
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
            <p className="text-gray-600">Enter, edit, export, bulk upload, and release marks.</p>
          </div>

          <div
            className="bg-blue-50 border border-blue-200 rounded-lg p-5 cursor-pointer hover:border-blue-400"
            onClick={() => navigate("/exam-officer/attendance")}
          >
            <h2 className="text-xl font-semibold">Attendance</h2>
            <p className="text-gray-600">Take and review attendance for assigned units.</p>
          </div>

          <div
            className="bg-blue-50 border border-blue-200 rounded-lg p-5 cursor-pointer hover:border-blue-400"
            onClick={() => navigate("/registrar/exams/timetable/technical")}
          >
            <h2 className="text-xl font-semibold">Technical Timetable</h2>
            <p className="text-gray-600">Generate/manage Technical Courses exam timetable.</p>
          </div>

          <div
            className="bg-blue-50 border border-blue-200 rounded-lg p-5 cursor-pointer hover:border-blue-400"
            onClick={() => navigate("/registrar/exams/timetable/business")}
          >
            <h2 className="text-xl font-semibold">Business Timetable</h2>
            <p className="text-gray-600">Generate/manage Business Courses exam timetable.</p>
          </div>

          <div
            className="bg-blue-50 border border-blue-200 rounded-lg p-5 cursor-pointer hover:border-blue-400"
            onClick={() => navigate("/registrar/transcript")}
          >
            <h2 className="text-xl font-semibold">Generate Transcript</h2>
            <p className="text-gray-600">Create and preview student transcripts with exam officer access.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamOfficerDashboard;
