import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";

const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await makeRequest.get("/tutor/assignments");
        setAssignments(res.data.assignments);
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) return <div className="p-8">Loading assignments...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Assignments</h1>
      {assignments.length === 0 ? (
        <p>No assignments found.</p>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="p-4 bg-white shadow rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-slate-600">Due: {new Date(a.due_date).toLocaleDateString()}</div>
              </div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                View / Grade
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;