import { useEffect, useState } from "react";
import { makeRequest } from "../../../axios";
import AccountantLayout from "./AccountantLayout";

const formatCurrency = (value) => `KSh ${Number(value || 0).toLocaleString()}`;

const Collections = () => {
  const [courses, setCourses] = useState([]);
  const [feeInputs, setFeeInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingCourseId, setSavingCourseId] = useState(null);
  const [error, setError] = useState("");

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await makeRequest.get("/accountant/collections");
      setCourses(res.data || []);
    } catch (err) {
      console.error("Failed to load collections:", err);
      setError("Failed to load collections summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleSaveFee = async (courseId) => {
    try {
      setSavingCourseId(courseId);
      setError("");
      await makeRequest.post("/accountant/course-fees", {
        course_id: courseId,
        amount: Number(feeInputs[courseId] || 0),
      });
      setFeeInputs((prev) => ({
        ...prev,
        [courseId]: "",
      }));
      await loadCollections();
    } catch (err) {
      console.error("Failed to save course fee:", err);
      setError(err?.response?.data?.error || "Failed to save course fee.");
    } finally {
      setSavingCourseId(null);
    }
  };

  const handleEditFee = (courseId, amount) => {
    setFeeInputs((prev) => ({
      ...prev,
      [courseId]: amount > 0 ? String(amount) : "",
    }));
  };

  return (
    <AccountantLayout
      title="Collections"
      subtitle="Compare fee expectations, receipts, and outstanding balances by course."
    >
      <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Course Fee Setup</h2>
        <p className="text-sm text-slate-500 mt-1">
          Set the fee amount for each course. Student balances are calculated from this amount minus posted payments.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading collections summary...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No courses available for collections reporting.</div>
        ) : (
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b">
                <th className="pb-3 font-semibold">Course</th>
                <th className="pb-3 font-semibold">Current Fee Per Student</th>
                <th className="pb-3 font-semibold">Set New Fee</th>
                <th className="pb-3 font-semibold">Students</th>
                <th className="pb-3 font-semibold">Expected</th>
                <th className="pb-3 font-semibold">Collected</th>
                <th className="pb-3 font-semibold">Outstanding</th>
                <th className="pb-3 font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.course_id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{course.course_name}</p>
                    <p className="text-sm text-slate-500">{course.course_code}</p>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        {course.fee_amount > 0 ? formatCurrency(course.fee_amount) : "Not set"}
                      </span>
                      <button
                        onClick={() => handleEditFee(course.course_id, course.fee_amount)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter fee"
                        value={feeInputs[course.course_id] ?? ""}
                        onChange={(e) =>
                          setFeeInputs((prev) => ({
                            ...prev,
                            [course.course_id]: e.target.value,
                          }))
                        }
                        className="w-32 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
                      />
                      <button
                        onClick={() => handleSaveFee(course.course_id)}
                        disabled={savingCourseId === course.course_id}
                        className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                      >
                        {savingCourseId === course.course_id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 text-slate-700">{course.total_students}</td>
                  <td className="py-4 font-semibold text-slate-900">{formatCurrency(course.total_expected)}</td>
                  <td className="py-4 font-semibold text-emerald-600">{formatCurrency(course.total_collected)}</td>
                  <td className="py-4 font-semibold text-rose-600">{formatCurrency(course.total_outstanding)}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-semibold">
                      {course.collection_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AccountantLayout>
  );
};

export default Collections;
