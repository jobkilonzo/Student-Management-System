import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";
import RegistrarDashboard from "../RegistrarDashboard/RegistrarDashboard";

const ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];

const AdminDashboardV2 = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("sms_role");

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    staff: 0,
    active: 0,
    courses: 0,
    units: 0,
  });
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [activeTab, setActiveTab] = useState("users");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    role: "registrar",
    course_id: "",
  });
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchUsers = async (pageNum = 1, searchTerm = search) => {
    try {
      const res = await makeRequest.get(`auth/users?page=${pageNum}&limit=10&search=${searchTerm}`);
      const usersData = res.data.users || res.data;
      setUsers(usersData);

      const totalPages = res.data.pagination?.pages || 1;
      setPages(totalPages);
      setPage(pageNum);

      const total = usersData.length;
      const students = usersData.filter((u) => u.role === "student").length;
      const staff = usersData.filter((u) =>
        ["registrar", "accountant", "tutor", "admin", "exam_officer"].includes(u.role)
      ).length;
      setStats((prev) => ({ ...prev, total, students, staff, active: total }));
    } catch (err) {
      console.error("Error fetching users:", err.response || err);
      toast.error("Failed to fetch users");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await makeRequest.get("registrar/courses");
      const coursesData = res.data || [];
      setCourses(coursesData);
      setStats((prev) => ({ ...prev, courses: coursesData.length }));

      let totalUnits = 0;
      for (const course of coursesData) {
        try {
          const unitsRes = await makeRequest.get(`registrar/units/course/${course.course_id}`);
          totalUnits += unitsRes.data.units ? unitsRes.data.units.length : unitsRes.data.length || 0;
        } catch (err) {
          console.error(`Error fetching units for course ${course.course_id}:`, err);
        }
      }

      setStats((prev) => ({ ...prev, units: totalUnits }));
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchUsers(1, search), 400);
    return () => clearTimeout(delay);
  }, [search]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await makeRequest.delete(`auth/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setEditForm({
      first_name: u.first_name || "",
      middle_name: u.middle_name || "",
      last_name: u.last_name || "",
      email: u.email || "",
      role: u.role || "registrar",
      course_id: u.course_id || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await makeRequest.put(`auth/users/${editingUser.id}`, {
        ...editForm,
        course_id: editForm.role === "student" ? editForm.course_id : null,
      });
      toast.success("Updated");
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleResetPassword = async () => {
    try {
      await makeRequest.put(`auth/users/${resetUser.id}`, { newPassword });
      toast.success("Password updated");
      setResetUser(null);
      setNewPassword("");
    } catch {
      toast.error("Failed");
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const accountantCount = users.filter((u) => u.role === "accountant").length;
  const examOfficerCount = users.filter((u) => u.role === "exam_officer").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-sky-200/70 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 text-white shadow-[0_25px_80px_-35px_rgba(14,116,144,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.24),_transparent_28%)]" />
          <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.8fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                Administration Center
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Admin Dashboard</h1>
                <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                  Coordinate users, academic operations, and system access from one place.
                  The layout keeps the most common admin actions closer to the top so the
                  dashboard feels more like a control room and less like a holding page.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/admin/users")}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                >
                  Open User Management
                </button>
                <button
                  onClick={() => navigate("/admin/courses")}
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Manage Courses
                </button>
                <button
                  onClick={() => navigate("/admin/notifications")}
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Send Notifications
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <DashboardHighlight
                label="User Directory"
                value={stats.total}
                description="Accounts currently visible in the admin view"
              />
              <DashboardHighlight
                label="Academic Catalogue"
                value={stats.courses}
                description={`${stats.units} units currently tracked across courses`}
              />
              <DashboardHighlight
                label="Staff Coverage"
                value={stats.staff}
                description="Registrar, finance, teaching, and exam roles"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={() => navigate("/registrar")}
            className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-sky-700"
          >
            Registrar Panel
          </button>
          <button
            onClick={() => navigate("/exam-management")}
            className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-cyan-700"
          >
            Exam Management
          </button>
          <button
            onClick={handleLogout}
            className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-rose-700"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Total Users" value={stats.total} icon="US" color="blue" />
          <StatCard title="Students" value={stats.students} icon="ST" color="green" />
          <StatCard title="Staff" value={stats.staff} icon="SF" color="purple" />
          <StatCard title="Courses" value={stats.courses} icon="CR" color="yellow" />
          <StatCard title="Units" value={stats.units} icon="UN" color="pink" />
          <StatCard title="Active" value={stats.active} icon="ON" color="indigo" />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="border-b border-slate-200 px-4 pt-4 sm:px-6">
            <nav className="flex flex-wrap gap-2 pb-4">
              <TabButton label="User Management" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
              <TabButton label="Registrar Panel" active={activeTab === "registrar"} onClick={() => setActiveTab("registrar")} />
              <TabButton label="System Overview" active={activeTab === "system"} onClick={() => setActiveTab("system")} />
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "users" && (
              <div className="space-y-6">
                <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-3">
                        <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                          User Operations
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">Keep user administration moving</h3>
                          <p className="mt-2 max-w-2xl text-sm text-slate-600">
                            Search the current directory here, then jump to the dedicated user page
                            when you want to create, edit, or delete accounts in full detail.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate("/admin/users")}
                          className="rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
                        >
                          Go to Create User
                        </button>
                        <button
                          onClick={() => navigate("/admin/transcripts")}
                          className="rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                        >
                          View Transcript Log
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    <MiniMetric label="Admins" value={adminCount} />
                    <MiniMetric label="Accountants" value={accountantCount} />
                    <MiniMetric label="Exam Officers" value={examOfficerCount} />
                  </div>
                </section>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <input
                      placeholder="Search users by name, email, or role..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{users.length}</span> users in this view
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  <table className="w-full">
                    <thead className="bg-slate-100/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {users.map((u) => (
                        <tr key={u.id} className="bg-white transition hover:bg-sky-50/60">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-slate-900">
                              {[u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusPill role={u.role} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            {role === "admin" && (
                              <>
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="text-indigo-600 transition hover:text-indigo-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setResetUser(u)}
                                  className="text-amber-600 transition hover:text-amber-800"
                                >
                                  Reset
                                </button>
                                {u.role !== "admin" && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-rose-600 transition hover:text-rose-800"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div className="flex justify-center">
                    <nav className="flex flex-wrap items-center gap-2">
                      {[...Array(pages)].map((_, i) => (
                        <button
                          key={`page-${i}`}
                          onClick={() => fetchUsers(i + 1)}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            page === i + 1
                              ? "bg-slate-900 text-white shadow"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            )}

            {activeTab === "registrar" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Registrar Panel</h3>
                    <p className="text-sm text-slate-600">
                      Use the embedded registrar view for course, unit, and student administration.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                  >
                    Back to Admin
                  </button>
                </div>
                <RegistrarDashboard />
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">System Overview</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Quick access to high-value admin areas and a lightweight operational snapshot.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
                    <h4 className="text-lg font-medium text-slate-900 mb-4">Quick Actions</h4>
                    <div className="space-y-3">
                      <ActionTile label="Users Management" onClick={() => navigate("/admin/users")} tone="blue" />
                      <ActionTile label="Course Management" onClick={() => navigate("/admin/courses")} tone="indigo" />
                      <ActionTile label="Transcript Log" onClick={() => navigate("/admin/transcripts")} tone="pink" />
                      <ActionTile label="Notifications" onClick={() => navigate("/admin/notifications")} tone="amber" />
                      <ActionTile label="System Settings" onClick={() => navigate("/admin/settings")} tone="purple" />
                      <ActionTile label="Registrar Panel" onClick={() => navigate("/registrar")} tone="emerald" />
                      <ActionTile label="Exam Officer Panel" onClick={() => navigate("/exam-officer")} tone="cyan" />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h4 className="text-lg font-medium text-slate-900 mb-4">System Status</h4>
                    <div className="space-y-4">
                      <StatusRow label="Database" value="Connected" tone="green" />
                      <StatusRow label="API Status" value="Online" tone="green" />
                      <StatusRow label="Role Coverage" value={`${ROLES.length} active roles`} tone="blue" />
                      <StatusRow label="Last Backup" value="2 hours ago" tone="slate" />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h4 className="text-lg font-medium text-slate-900 mb-4">Recent Activity</h4>
                    <div className="space-y-3 text-sm text-slate-600">
                      <ActivityItem text="New student registered" />
                      <ActivityItem text="Course updated" />
                      <ActivityItem text="Exam marks entered" />
                      <ActivityItem text="User password reset" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingUser && (
        <Modal onClose={() => setEditingUser(null)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="First Name"
                  required
                />
                <input
                  value={editForm.middle_name}
                  onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                  className="rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Middle Name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Last Name"
                  required
                />
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Email"
                  type="email"
                  required
                />
              </div>

              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value, course_id: "" })}
                className="w-full rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>

              {editForm.role === "student" && courses.length > 0 && (
                <select
                  value={editForm.course_id}
                  onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}
                  className="w-full rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-sky-700 px-6 py-3 font-semibold text-white shadow transition duration-200 hover:bg-sky-800"
              >
                Save Changes
              </button>
            </form>
          </div>
        </Modal>
      )}

      {resetUser && (
        <Modal onClose={() => setResetUser(null)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h2>
            <p className="text-gray-600 mb-4">
              Reset password for:{" "}
              <span className="font-medium">
                {[resetUser.first_name, resetUser.middle_name, resetUser.last_name].filter(Boolean).join(" ")}
              </span>
            </p>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              onClick={handleResetPassword}
              className="w-full rounded-2xl bg-sky-700 px-6 py-3 font-semibold text-white shadow transition duration-200 hover:bg-sky-800"
            >
              Update Password
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const DashboardHighlight = ({ label, value, description }) => (
  <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-300">{label}</p>
    <p className="mt-3 text-3xl font-bold text-white">{value || 0}</p>
    <p className="mt-2 text-sm text-slate-300">{description}</p>
  </div>
);

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "from-sky-500 to-cyan-500",
    green: "from-sky-500 to-cyan-500",
    purple: "from-cyan-500 to-sky-600",
    yellow: "from-sky-500 to-cyan-500",
    pink: "from-cyan-500 to-sky-600",
    indigo: "from-sky-600 to-cyan-500",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">{value || 0}</h2>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${colorClasses[color]} px-3 py-2 text-sm font-bold tracking-[0.2em] text-white shadow`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
      active
        ? "bg-sky-700 text-white shadow"
        : "bg-sky-50 text-sky-700 hover:bg-sky-100"
    }`}
  >
    {label}
  </button>
);

const MiniMetric = ({ label, value }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value || 0}</p>
  </div>
);

const StatusPill = ({ role }) => {
  const styles = {
    admin: "bg-rose-100 text-rose-700",
    student: "bg-emerald-100 text-emerald-700",
    registrar: "bg-blue-100 text-blue-700",
    accountant: "bg-amber-100 text-amber-700",
    tutor: "bg-violet-100 text-violet-700",
    exam_officer: "bg-cyan-100 text-cyan-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[role] || "bg-slate-100 text-slate-700"}`}>
      {role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")}
    </span>
  );
};

const ActionTile = ({ label, onClick, tone }) => {
  const tones = {
    blue: "bg-sky-600 hover:bg-sky-700",
    indigo: "bg-sky-700 hover:bg-sky-800",
    pink: "bg-cyan-600 hover:bg-cyan-700",
    amber: "bg-sky-500 hover:bg-sky-600",
    purple: "bg-sky-600 hover:bg-sky-700",
    emerald: "bg-cyan-600 hover:bg-cyan-700",
    cyan: "bg-sky-700 hover:bg-sky-800",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white transition ${tones[tone]}`}
    >
      {label}
    </button>
  );
};

const StatusRow = ({ label, value, tone }) => {
  const tones = {
    green: "text-sky-700",
    blue: "text-cyan-700",
    slate: "text-slate-500",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${tones[tone] || "text-slate-700"}`}>{value}</span>
    </div>
  );
};

const ActivityItem = ({ text }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
    <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />
    <span>{text}</span>
  </div>
);

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
      {children}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-2xl font-bold leading-none text-slate-400 hover:text-slate-600"
      >
        x
      </button>
    </div>
  </div>
);

export default AdminDashboardV2;
