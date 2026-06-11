import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import SessionList from "../../components/ExamSessions/SessionList";

const ManageExamSessions = () => {
  useEffect(() => { document.title = 'Manage Exam Sessions'; }, []);

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Manage Exam Sessions</h1>
        <p className="text-sm text-slate-600 mt-1">Create, edit, reorder and activate/deactivate exam sessions used by the timetable generator.</p>
      </div>

      <SessionList />
    </div>
  );
};

export default ManageExamSessions;
