import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../axios";

const ROLES = ["registrar", "student", "accountant", "tutor"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "registrar" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await makeRequest.get("auth/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    navigate("/login");
  };

  const handleResetPassword = async (userId) => {
    const newPassword = window.prompt("Enter new password for this user:");
    if (!newPassword) return;

    try {
      await makeRequest.put(`auth/users/${userId}`, { newPassword });
      await fetchUsers();
      alert("Password updated successfully.");
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update password.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await makeRequest.delete(`auth/users/${userId}`);
      await fetchUsers();
      alert("User deleted successfully.");
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete user.");
    }
  };

  useEffect(() => {
    fetchUsers();

    const storedUser = localStorage.getItem("sms_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setProfileForm((prev) => ({
          ...prev,
          name: parsed.name || "",
          email: parsed.email || "",
        }));
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await makeRequest.post("auth/register", form);
      setSuccess(`Created ${res.data.user.role} account for ${res.data.user.name}`);
      setForm({ name: "", email: "", password: "", role: "registrar" });
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (profileForm.newPassword && !profileForm.currentPassword) {
      setProfileError("Please enter your current password to set a new password.");
      return;
    }

    setProfileLoading(true);

    try {
      const res = await makeRequest.put("auth/me", profileForm);
      const { token, user } = res.data;

      if (token) {
        localStorage.setItem("sms_token", token);
      }
      if (user) {
        localStorage.setItem("sms_user", JSON.stringify({ name: user.name, email: user.email }));
      }

      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      setProfileError(err?.response?.data?.error || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 px-8 py-12">
      <div className="w-full mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-600 mt-2">
              Manage user accounts and view system users.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Update your account</h2>

              {profileError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3">
                  {profileSuccess}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleProfileUpdate}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    type="email"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Current password</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                    value={profileForm.currentPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                    type="password"
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">New password</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                    value={profileForm.newPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    type="password"
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {profileLoading ? "Saving…" : "Save changes"}
                </button>
              </form>
            </section>          </div>
            <section className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Create new account</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3">
                {success}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  type="email"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  type="password"
                  placeholder="Password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-400 focus:outline-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create account"}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Existing users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-slate-500 border-b">
                    <th className="py-3 min-w-[180px]">Name</th>
                    <th className="py-3 min-w-[240px]">Email</th>
                    <th className="py-3 min-w-[120px]">Role</th>
                    <th className="py-3 min-w-[220px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-b-0">
                      <td className="py-3 text-sm text-slate-700 min-w-[180px]">{user.name}</td>
                      <td className="py-3 text-sm text-slate-700 min-w-[240px]">{user.email}</td>
                      <td className="py-3 text-sm text-slate-700 min-w-[120px]">{user.role}</td>
                      <td className="py-3 text-sm text-slate-700 min-w-[220px]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          onClick={() => handleResetPassword(user.id)}
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
