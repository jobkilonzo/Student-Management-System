import { useNavigate } from "react-router-dom";

const ReviewMarks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <button onClick={() => navigate("/exam-officer")} className="mb-4 text-sm text-blue-600">← Back to Dashboard</button>
        <h1 className="text-2xl font-bold mb-4">Review Marks</h1>
        <p className="text-gray-600">(Placeholder) Add controls for exam officer to verify and approve uploaded marks.</p>
      </div>
    </div>
  );
};

export default ReviewMarks;
