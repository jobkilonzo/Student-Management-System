import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";

const ProgressReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await makeRequest.get("/tutor/reports");
        setReports(res.data.reports);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <div className="p-8">Loading progress reports...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Progress Reports</h1>
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="p-4 bg-white shadow rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{r.student_name}</div>
                <div className="text-sm text-slate-600">Class: {r.class_name}</div>
              </div>
              <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                View Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressReportsPage;