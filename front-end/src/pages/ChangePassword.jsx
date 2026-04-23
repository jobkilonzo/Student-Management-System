import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../axios";
import { roleRedirect } from "../utils/roleRedirect";

const ChangePassword = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("sms_role");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.currentPassword || !form.newPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      await makeRequest.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      localStorage.setItem("sms_must_change_password", "false");
      const redirect = roleRedirect[role] || "/login";
      navigate(redirect, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#bfdbfe_30%,_#e0f2fe_58%,_#f8fafc_78%)] px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-sky-100 bg-white/95 shadow-[0_28px_80px_-35px_rgba(14,116,144,0.35)] backdrop-blur">
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500 px-8 py-10 text-center text-white">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Change Password</h1>
          <p className="mt-2 text-sm text-sky-100">You must update your password to continue.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-sky-100 px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-sky-100 px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-sky-100 px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 py-3 font-semibold text-white shadow-lg transition duration-300 hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;

