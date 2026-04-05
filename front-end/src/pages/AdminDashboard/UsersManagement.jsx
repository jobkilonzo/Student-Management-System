import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";

const ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];
const GENDERS = ["male", "female", "other"];

const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "registrar",
    course_id: "",
    gender: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/auth/users");
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await makeRequest.get("/registrar/courses");
      setCourses(res.data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "registrar",
      course_id: "",
      gender: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingUser) {
        await makeRequest.put(`/auth/users/${editingUser.id}`, {
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          email: form.email,
          role: form.role,
          gender: form.gender,
          ...(form.password ? { newPassword: form.password } : {}),
          course_id: form.role === "student" ? form.course_id : undefined,
        });
        toast.success("User updated successfully");
      } else {
        const payload = {
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          role: form.role,
          gender: form.gender,
        };
        if (form.role === "student") payload.course_id = form.course_id;
        await makeRequest.post("/auth/register", payload);
        toast.success("User created successfully");
      }
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      password: "",
      role: user.role || "registrar",
      course_id: user.course_id || "",
      gender: user.gender || "",
    });
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await makeRequest.delete(`/auth/users/${userId}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Delete failed");
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    return (
      u.first_name?.toLowerCase().includes(query) ||
      u.middle_name?.toLowerCase().includes(query) ||
      u.last_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-sky-200/70 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 text-white shadow-[0_25px_80px_-35px_rgba(14,116,144,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.22),_transparent_28%)]" />
          <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.8fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                User Directory
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Users Management</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Create accounts, update role assignments, and keep the institution directory organized
                  from one polished workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/admin")}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-800 shadow-lg transition hover:bg-sky-50"
                >
                  Back to Admin Dashboard
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {editingUser ? "Clear Edit Form" : "Reset Form"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <HeroMetric label="Total Users" value={users.length} />
              <HeroMetric label="Available Roles" value={ROLES.length} />
              <HeroMetric label="Courses" value={courses.length} />
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.25fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                  {editingUser ? "Edit User" : "Create User"}
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  {editingUser ? "Update user account" : "Create a new account"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Add core user details and assign the correct role. Student accounts can also be linked to a course.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="First Name"
                  value={form.first_name}
                  onChange={(value) => setForm({ ...form, first_name: value })}
                  required
                />
                <Field
                  label="Last Name"
                  value={form.last_name}
                  onChange={(value) => setForm({ ...form, last_name: value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Middle Name"
                  value={form.middle_name}
                  onChange={(value) => setForm({ ...form, middle_name: value })}
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm({ ...form, email: value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Role"
                  value={form.role}
                  onChange={(value) => setForm({ ...form, role: value, course_id: "" })}
                  options={ROLES.map((r) => ({
                    value: r,
                    label: r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  }))}
                />
                <SelectField
                  label="Gender"
                  value={form.gender}
                  onChange={(value) => setForm({ ...form, gender: value })}
                  options={[
                    { value: "", label: "Select Gender" },
                    ...GENDERS.map((g) => ({
                      value: g,
                      label: g.charAt(0).toUpperCase() + g.slice(1),
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label={editingUser ? "New Password" : "Password"}
                  type="password"
                  value={form.password}
                  onChange={(value) => setForm({ ...form, password: value })}
                  required={!editingUser}
                  placeholder={editingUser ? "Leave blank to keep current password" : ""}
                />
              </div>

              {form.role === "student" && (
                <SelectField
                  label="Course"
                  value={form.course_id}
                  onChange={(value) => setForm({ ...form, course_id: value })}
                  required
                  options={[
                    { value: "", label: "Select Course" },
                    ...courses.map((c) => ({ value: c.course_id, label: c.course_name })),
                  ]}
                />
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
                >
                  {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                </button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                  User List
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Institution accounts</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Search, review, and manage the current system users.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{filteredUsers.length}</span> users shown
              </div>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading users...</div>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-100/80">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Gender</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">
                            No users found.
                           </td>
                         </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="bg-white transition hover:bg-sky-50/60">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">
                                {`${user.first_name || ""} ${user.middle_name || ""} ${user.last_name || ""}`.trim()}
                              </div>
                             </td>
                            <td className="px-5 py-4 text-slate-600">{user.email}</td>
                            <td className="px-5 py-4">
                              {user.gender ? (
                                <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                  {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                             </td>
                            <td className="px-5 py-4">
                              <RolePill role={user.role} />
                             </td>
                            <td className="px-5 py-4 text-slate-600">
                              {new Date(user.created_at || user.createdAt || "").toLocaleString()}
                             </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-200"
                                  onClick={() => handleEdit(user)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  Delete
                                </button>
                              </div>
                             </td>
                           </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const HeroMetric = ({ label, value }) => (
  <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-300">{label}</p>
    <p className="mt-3 text-3xl font-bold text-white">{value || 0}</p>
  </div>
);

const Field = ({ label, value, onChange, required, type = "text", placeholder = "" }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder || label}
      className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    />
  </label>
);

const SelectField = ({ label, value, onChange, options, required }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    >
      {options.map((option) => (
        <option key={`${label}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const RolePill = ({ role }) => {
  const styles = {
    admin: "bg-sky-100 text-sky-700",
    student: "bg-cyan-100 text-cyan-700",
    registrar: "bg-sky-100 text-sky-700",
    accountant: "bg-sky-50 text-sky-800",
    tutor: "bg-cyan-50 text-cyan-800",
    exam_officer: "bg-sky-100 text-sky-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[role] || "bg-slate-100 text-slate-700"}`}>
      {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  );
};

export default UsersManagement;