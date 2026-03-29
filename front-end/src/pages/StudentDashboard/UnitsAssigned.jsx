import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const UnitsAssigned = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssignedUnits();
  }, []);

  const fetchAssignedUnits = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/student/units");
      setUnits(res.data || []);
    } catch (err) {
      console.error("Error fetching units:", err);
      setError("Failed to load assigned units");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Units Assigned</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">Loading units...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No units assigned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Unit Code</th>
                    <th className="p-3 text-left">Unit Name</th>
                    <th className="p-3 text-left">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.unit_id} className="border-b hover:bg-blue-50 transition">
                      <td className="p-3 font-semibold text-blue-600">{unit.unit_code}</td>
                      <td className="p-3">{unit.unit_name}</td>
                      <td className="p-3">{unit.course_name} ({unit.course_code})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitsAssigned;