import { useNavigate } from "react-router-dom";

const ManageExams = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <button onClick={() => navigate("/exam-officer")} className="mb-4 text-sm text-blue-600">← Back to Dashboard</button>
        <h1 className="text-2xl font-bold mb-4">Exam Timetable</h1>
        <p className="text-gray-600">(Placeholder) Add controls to create and update exam timetables.</p>
      </div>
    </div>
  );
};

export default ManageExams;
