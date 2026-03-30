import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../axios";
import { roleRedirect } from "../utils/roleRedirect";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await makeRequest.post("/auth/login", form);
      const { token, user } = res.data;

      localStorage.setItem("sms_token", token);
      localStorage.setItem("sms_role", user.role);

      const redirect = roleRedirect[user.role] || "/login";
      navigate(redirect, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#bfdbfe_30%,_#e0f2fe_58%,_#f8fafc_78%)] px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-sky-100 bg-white/95 shadow-[0_28px_80px_-35px_rgba(14,116,144,0.35)] backdrop-blur">
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500 px-8 py-10 text-center text-white">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            <span className="block">St John Paul II</span>
            <span className="mt-1 block text-sky-200">Institute</span>
          </h1>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email and password to access your account.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-sky-100 px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-sky-100 px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 py-3 font-semibold text-white shadow-lg transition duration-300 hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {"\u00A9"} {new Date().getFullYear()} St John Paul II Institute
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
