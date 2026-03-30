import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";
import StudentPortalLayout from "./StudentPortalLayout";

const UnitsAssigned = () => {
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

  return (
    <StudentPortalLayout
      title="Assigned Units"
      subtitle="View the academic units attached to your course and track the subjects you are expected to complete."
    >
      <div className="space-y-5">
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
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Total Units</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{units.length}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Primary Course</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{units[0]?.course_name || "Not available"}</p>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Course Code</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{units[0]?.course_code || "-"}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-100/90">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit Code</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit Name</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.unit_id} className="border-b border-slate-200 bg-white transition hover:bg-blue-50/60">
                      <td className="p-4 font-semibold text-blue-700">{unit.unit_code}</td>
                      <td className="p-4 text-slate-700">{unit.unit_name}</td>
                      <td className="p-4 text-slate-600">{unit.course_name} ({unit.course_code})</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
          )}
      </div>
    </StudentPortalLayout>
  );
};

export default UnitsAssigned;
