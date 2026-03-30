import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { makeRequest } from "../../../axios";
import AccountantLayout from "./AccountantLayout";

const formatCurrency = (value) => `KSh ${Number(value || 0).toLocaleString()}`;

const StatCard = ({ label, value, tone }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
    <p className="text-sm text-slate-500">{label}</p>
    <h2 className={`text-3xl font-bold mt-2 ${tone}`}>{value}</h2>
  </div>
);

const AccountantDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [profileRes, overviewRes] = await Promise.all([
          makeRequest.get("/accountant/profile"),
          makeRequest.get("/accountant/overview"),
        ]);

        setProfile(profileRes.data);
        setOverview(overviewRes.data);
      } catch (err) {
        console.error("Failed to load accountant dashboard:", err);
        setError("Failed to load accountant dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <AccountantLayout
      title="Accountant Dashboard"
      subtitle={profile ? `Welcome back, ${profile.name}. Track fee performance and student account health.` : "Track fee performance and student account health."}
    >
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-slate-500">Loading dashboard...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard label="Total Expected Fees" value={formatCurrency(overview?.stats?.total_expected)} tone="text-slate-900" />
            <StatCard label="Collected So Far" value={formatCurrency(overview?.stats?.total_collected)} tone="text-emerald-600" />
            <StatCard label="Outstanding Balance" value={formatCurrency(overview?.stats?.total_outstanding)} tone="text-rose-600" />
            <StatCard label="Collection Rate" value={`${overview?.stats?.collection_rate || 0}%`} tone="text-cyan-700" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Recent Account Activity</h2>
                  <p className="text-slate-500 text-sm">Latest student fee activity generated from current student records.</p>
                </div>
                <Link to="/accountant/student-accounts" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
                  View accounts
                </Link>
              </div>

              <div className="space-y-3">
                {(overview?.recent_activity || []).map((item) => (
                  <div key={item.id || item.student_id} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.student_name}</p>
                      <p className="text-sm text-slate-500">{item.reg_no} • {item.course_name || "No course assigned"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-slate-500">
                        {item.payment_date ? new Date(item.payment_date).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Snapshot</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Students with active balances</p>
                  <p className="text-2xl font-bold text-slate-900">{overview?.stats?.students_with_balances || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Managed courses</p>
                  <p className="text-2xl font-bold text-slate-900">{overview?.stats?.total_courses || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Finance team users</p>
                  <p className="text-2xl font-bold text-slate-900">{overview?.stats?.total_accountants || 0}</p>
                </div>
                <Link
                  to="/accountant/reports"
                  className="block rounded-xl bg-teal-700 hover:bg-teal-800 transition text-white p-4 font-semibold text-center"
                >
                  Open finance reports
                </Link>
              </div>
            </section>
          </div>
        </div>
      )}
    </AccountantLayout>
  );
};

export default AccountantDashboard;
