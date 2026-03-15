import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../axios";

const roleRedirect = {
  admin: "/admin",
  registrar: "/registrar",
  student: "/student",
  accountant: "/accountant",
  tutor: "/tutor",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect already-authenticated users away from login page
  useEffect(() => {
    const token = localStorage.getItem("sms_token");
    const role = localStorage.getItem("sms_role");
    if (token && role) {
      const redirect = roleRedirect[role] || "/";
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await makeRequest.post("auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("sms_token", token);
      localStorage.setItem("sms_role", user.role);
      localStorage.setItem("sms_user", JSON.stringify({ name: user.name, email: user.email }));

      const redirect = roleRedirect[user.role] || "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">Login</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Default admin: <span className="font-semibold">admin@school.com</span> / <span className="font-semibold">Admin123!</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
