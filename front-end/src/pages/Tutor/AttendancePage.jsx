import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";

const AttendancePage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await makeRequest.get("/tutor/attendance/today");
        setClasses(res.data.classes);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) return <div className="p-8">Loading attendance...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Mark Attendance</h1>
      {classes.length === 0 ? (
        <p>No classes scheduled for today.</p>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div key={cls.id} className="p-4 bg-white shadow rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{cls.subject}</div>
                <div className="text-sm text-slate-600">{cls.room} - {cls.year}</div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Mark Attendance
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;