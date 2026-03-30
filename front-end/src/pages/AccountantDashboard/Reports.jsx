import { useEffect, useState } from "react";
import { makeRequest } from "../../../axios";
import AccountantLayout from "./AccountantLayout";

const formatCurrency = (value) => `KSh ${Number(value || 0).toLocaleString()}`;

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const res = await makeRequest.get("/accountant/reports");
        setReport(res.data);
      } catch (err) {
        console.error("Failed to load accountant reports:", err);
        setError("Failed to load accountant reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  return (
    <AccountantLayout
      title="Finance Reports"
      subtitle="Track status distribution, module-level performance, and the students with the highest balances."
    >
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-slate-500">Loading reports...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Status Breakdown</h2>
              <div className="space-y-3">
                {(report?.status_breakdown || []).map((item) => (
                  <div key={item.status} className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{item.status}</span>
                    <span className="text-slate-900 font-bold">{item.total_students}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Module Performance</h2>
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b">
                    <th className="pb-3 font-semibold">Module</th>
                    <th className="pb-3 font-semibold">Students</th>
                    <th className="pb-3 font-semibold">Expected</th>
                    <th className="pb-3 font-semibold">Collected</th>
                    <th className="pb-3 font-semibold">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.module_breakdown || []).map((item) => (
                    <tr key={item.module} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="py-4 font-semibold text-slate-900">{item.module}</td>
                      <td className="py-4 text-slate-700">{item.total_students}</td>
                      <td className="py-4 font-semibold text-slate-900">{formatCurrency(item.total_expected)}</td>
                      <td className="py-4 font-semibold text-emerald-600">{formatCurrency(item.total_collected)}</td>
                      <td className="py-4 font-semibold text-rose-600">{formatCurrency(item.total_outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <section className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Top Outstanding Accounts</h2>
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b">
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Course</th>
                  <th className="pb-3 font-semibold">Module</th>
                  <th className="pb-3 font-semibold">Paid</th>
                  <th className="pb-3 font-semibold">Balance</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(report?.top_defaulters || []).map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="py-4">
                      <p className="font-semibold text-slate-900">{student.student_name}</p>
                      <p className="text-sm text-slate-500">{student.reg_no}</p>
                    </td>
                    <td className="py-4 text-slate-700">{student.course_name || "-"}</td>
                    <td className="py-4 text-slate-700">{student.module || "-"}</td>
                    <td className="py-4 font-semibold text-emerald-600">{formatCurrency(student.amount_paid)}</td>
                    <td className="py-4 font-semibold text-rose-600">{formatCurrency(student.balance)}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </AccountantLayout>
  );
};

export default Reports;
