import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../axios";

const ROLES = ["registrar", "student", "accountant", "tutor"];

const AdminDashboard = () => {
  const navigate = useNavigate();

  /** --- Users & Form State --- */
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "registrar" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /** --- Profile State --- */
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  /** --- Edit User State --- */
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "registrar" });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  /** --- Fetch users from backend --- */
  const fetchUsers = async () => {
    try {
      const res = await makeRequest.get("auth/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
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
      } catch (e) {}
    }
  }, []);

  /** --- Logout --- */
  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    navigate("/login");
  };

  /** --- Reset Password --- */
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

  /** --- Delete User --- */
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await makeRequest.delete(`auth/users/${userId}`);
      await fetchUsers();
      alert("User deleted successfully.");
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete user.");
    }
  };

  /** --- Start Editing User --- */
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setEditError("");
    setEditSuccess("");
  };

  /** --- Submit Edited User --- */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    setEditError("");
    setEditSuccess("");

    try {
      await makeRequest.put(`auth/users/${editingUser.id}`, editForm);
      setEditSuccess("User updated successfully!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  /** --- Create New User --- */
  const handleSubmit = async (e) => {
    e.preventDefault();
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

  /** --- Update Admin Profile --- */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
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

      if (token) localStorage.setItem("sms_token", token);
      if (user) localStorage.setItem("sms_user", JSON.stringify({ name: user.name, email: user.email }));

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-600 mt-2">Manage user accounts and view system users.</p>
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
          {/* Admin Profile */}
          <section className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Update your account</h2>
            {profileError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">{profileError}</div>}
            {profileSuccess && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3">{profileSuccess}</div>}

            <form className="space-y-4" onSubmit={handleProfileUpdate}>
              <input placeholder="Full name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
              <input placeholder="Email" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
              <input placeholder="Current password" type="password" value={profileForm.currentPassword} onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })} className="w-full rounded-xl border px-4 py-3" />
              <input placeholder="New password" type="password" value={profileForm.newPassword} onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })} className="w-full rounded-xl border px-4 py-3" />
              <button type="submit" disabled={profileLoading} className="w-full bg-blue-600 px-4 py-3 text-white rounded-xl">{profileLoading ? "Saving…" : "Save changes"}</button>
            </form>
          </section>

          {/* Create New User */}
          <section className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Create new account</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">{error}</div>}
            {success && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3">{success}</div>}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
              <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border px-4 py-3">
                {ROLES.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
              </select>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 px-4 py-3 text-white rounded-xl">{loading ? "Creating…" : "Create account"}</button>
            </form>
          </section>
        </div>

        {/* Existing Users */}
        <section className="bg-white rounded-3xl shadow-lg p-8 mt-8">
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
                    <td className="py-3 text-sm text-slate-700">{user.name}</td>
                    <td className="py-3 text-sm text-slate-700">{user.email}</td>
                    <td className="py-3 text-sm text-slate-700">{user.role}</td>
                    <td className="py-3 text-sm text-slate-700 flex flex-wrap gap-2">
                      <button className="bg-yellow-500 px-3 py-1 text-xs text-white rounded-full" onClick={() => handleEditUser(user)}>Edit</button>
                      <button className="bg-blue-600 px-3 py-1 text-xs text-white rounded-full" onClick={() => handleResetPassword(user.id)}>Reset password</button>
                      <button className="bg-red-600 px-3 py-1 text-xs text-white rounded-full" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Edit User Form */}
        {editingUser && (
          <section className="bg-white rounded-3xl shadow-lg p-8 mt-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Edit User: {editingUser.name}</h2>
            {editError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">{editError}</div>}
            {editSuccess && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3">{editSuccess}</div>}

            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <input placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
              <input placeholder="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full rounded-xl border px-4 py-3">
                {ROLES.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
              </select>

              <div className="flex gap-2">
                <button type="submit" disabled={editLoading} className="bg-blue-600 px-4 py-3 text-white rounded-xl">{editLoading ? "Updating…" : "Update User"}</button>
                <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-400 px-4 py-3 text-white rounded-xl">Cancel</button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;