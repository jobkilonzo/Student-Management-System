import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../axios";

const AccountantDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await makeRequest.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Accountant Dashboard</h1>
              <p className="mt-2 text-slate-600">
                Welcome back, {user.name}! Manage financial records, fees, and payments.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">$125,000</div>
            <div className="text-slate-600">Total Revenue</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">$85,000</div>
            <div className="text-slate-600">Fees Collected</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-600">$15,000</div>
            <div className="text-slate-600">Outstanding</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">$25,000</div>
            <div className="text-slate-600">Salaries Paid</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium">Fee Payment</div>
                  <div className="text-sm text-slate-600">John Doe - Computer Science</div>
                </div>
                <div className="text-green-600 font-semibold">+$2,500</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium">Salary Payment</div>
                  <div className="text-sm text-slate-600">Dr. Smith - Mathematics</div>
                </div>
                <div className="text-red-600 font-semibold">-$3,200</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium">Equipment Purchase</div>
                  <div className="text-sm text-slate-600">Lab Equipment</div>
                </div>
                <div className="text-blue-600 font-semibold">-$1,500</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Financial Management</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-left">
                <div className="font-medium text-green-700">💰 Fee Collection</div>
                <div className="text-sm text-slate-600">Record payments</div>
              </button>
              <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-left">
                <div className="font-medium text-blue-700">📊 Financial Reports</div>
                <div className="text-sm text-slate-600">Generate reports</div>
              </button>
              <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-left">
                <div className="font-medium text-purple-700">👥 Salary Management</div>
                <div className="text-sm text-slate-600">Payroll system</div>
              </button>
              <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition text-left">
                <div className="font-medium text-orange-700">📈 Budget Planning</div>
                <div className="text-sm text-slate-600">Annual budget</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
