import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";
import RegistrarDashboard from "../RegistrarDashboard/RegistrarDashboard";

const ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("sms_role");

  /** ---------------- STATE ---------------- */
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    staff: 0,
    active: 0,
    courses: 0,
    units: 0
  });
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [activeTab, setActiveTab] = useState("users");

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "registrar",
    course_id: ""
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    role: "registrar",
    course_id: ""
  });

  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  /** ---------------- FETCH USERS ---------------- */
  const fetchUsers = async (pageNum = 1, searchTerm = search) => {
    try {
      const res = await makeRequest.get(`auth/users?page=${pageNum}&limit=10&search=${searchTerm}`);
      const usersData = res.data.users || res.data;
      setUsers(usersData);

      const totalPages = res.data.pagination?.pages || 1;
      setPages(totalPages);
      setPage(pageNum);

      const total = usersData.length;
      const students = usersData.filter(u => u.role === "student").length;
      const staff = usersData.filter(u => ["registrar","accountant","tutor","admin","exam_officer"].includes(u.role)).length;
      const active = total;
      setStats(prev => ({ ...prev, total, students, staff, active }));
    } catch (err) {
      console.error("Error fetching users:", err.response || err);
      toast.error("Failed to fetch users");
    }
  };

  /** ---------------- FETCH COURSES ---------------- */
  const fetchCourses = async () => {
    try {
      const res = await makeRequest.get("registrar/courses");
      const coursesData = res.data || [];
      setCourses(coursesData);
      setStats(prev => ({ ...prev, courses: coursesData.length }));

      // Fetch units count
      let totalUnits = 0;
      for (const course of coursesData) {
        try {
          const unitsRes = await makeRequest.get(`registrar/units/course/${course.course_id}`);
          totalUnits += unitsRes.data.units ? unitsRes.data.units.length : (unitsRes.data.length || 0);
        } catch (err) {
          console.error(`Error fetching units for course ${course.course_id}:`, err);
        }
      }
      setStats(prev => ({ ...prev, units: totalUnits }));
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  /** ---------------- INIT ---------------- */
  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  /** ---------------- SEARCH (Debounce) ---------------- */
  useEffect(() => {
    const delay = setTimeout(() => fetchUsers(1, search), 400);
    return () => clearTimeout(delay);
  }, [search]);

  /** ---------------- ACTIONS ---------------- */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await makeRequest.post("auth/register", {
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        role: form.role,
        course_id: form.role === "student" ? form.course_id : null
      });
      toast.success("User created");
      setForm({ first_name: "", middle_name: "", last_name: "", email: "", password: "", role: "registrar", course_id: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Error");
    }
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
      first_name: u.first_name,
      middle_name: u.middle_name,
      last_name: u.last_name,
      email: u.email,
      role: u.role,
      course_id: u.course_id || ""
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await makeRequest.put(`auth/users/${editingUser.id}`, {
        ...editForm,
        course_id: editForm.role === "student" ? editForm.course_id : null
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

  /** ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage users, courses, and system settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/registrar")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition duration-200"
              >
                Registrar Panel
              </button>
              <button
                onClick={() => navigate("/exam-management")}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition duration-200"
              >
                Exam Management
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.total} icon="👥" color="blue" />
          <StatCard title="Students" value={stats.students} icon="🎓" color="green" />
          <StatCard title="Staff" value={stats.staff} icon="👨‍🏫" color="purple" />
          <StatCard title="Courses" value={stats.courses} icon="📚" color="yellow" />
          <StatCard title="Units" value={stats.units} icon="📖" color="pink" />
          <StatCard title="Active" value={stats.active} icon="✅" color="indigo" />
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "users"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab("registrar")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "registrar"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Registrar Panel
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "system"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                System Overview
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "users" && (
              <>
                {/* SEARCH & CREATE USER */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      placeholder="Search users by name or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-150"
                  >
                    Go to Create User
                  </button>
                </div>

                <div className="mb-6 text-sm text-gray-600">
                  Use the full user management page for creating or editing users.
                </div>

                {/* USERS TABLE */}
                <div className="overflow-x-auto bg-gray-50 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {[u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              u.role === "admin" ? "bg-red-100 text-red-800" :
                              u.role === "student" ? "bg-green-100 text-green-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {u.role.charAt(0).toUpperCase() + u.role.slice(1).replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {role === "admin" && (
                              <>
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="text-indigo-600 hover:text-indigo-900 transition duration-150"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setResetUser(u)}
                                  className="text-yellow-600 hover:text-yellow-900 transition duration-150"
                                >
                                  Reset
                                </button>
                                {u.role !== "admin" && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-red-600 hover:text-red-900 transition duration-150"
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

                {/* PAGINATION */}
                {pages > 1 && (
                  <div className="flex justify-center mt-6">
                    <nav className="flex items-center space-x-1">
                      {[...Array(pages)].map((_, i) => (
                        <button
                          key={`page-${i}`}
                          onClick={() => fetchUsers(i + 1)}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            page === i + 1
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                          } transition duration-150`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </>
            )}

            {activeTab === "registrar" && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Registrar Panel</h3>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg"
                  >
                    Back to Admin
                  </button>
                </div>
                <RegistrarDashboard />
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate("/admin/users")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Users Management
                      </button>
                      <button
                        onClick={() => navigate("/admin/courses")}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Course Management
                      </button>
                      <button
                        onClick={() => navigate("/admin/transcripts")}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Transcript Log
                      </button>
                      <button
                        onClick={() => navigate("/admin/notifications")}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Notifications
                      </button>
                      <button
                        onClick={() => navigate("/admin/settings")}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        System Settings
                      </button>
                      <button
                        onClick={() => navigate("/registrar")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Registrar Panel
                      </button>
                      <button
                        onClick={() => navigate("/exam-officer")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                      >
                        Exam Officer Panel
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">System Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database:</span>
                        <span className="text-green-600 font-medium">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">API Status:</span>
                        <span className="text-green-600 font-medium">Online</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Backup:</span>
                        <span className="text-gray-500">2 hours ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>• New student registered</div>
                      <div>• Course updated</div>
                      <div>• Exam marks entered</div>
                      <div>• User password reset</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <Modal onClose={() => setEditingUser(null)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={editForm.first_name}
                  onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First Name"
                  required
                />
                <input
                  value={editForm.middle_name}
                  onChange={e => setEditForm({ ...editForm, middle_name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Middle Name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={editForm.last_name}
                  onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last Name"
                  required
                />
                <input
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email"
                  type="email"
                  required
                />
              </div>

              <select
                value={editForm.role}
                onChange={e => setEditForm({ ...editForm, role: e.target.value, course_id: "" })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>

              {editForm.role === "student" && courses.length > 0 && (
                <select
                  value={editForm.course_id}
                  onChange={e => setEditForm({ ...editForm, course_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition duration-200"
              >
                Save Changes
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetUser && (
        <Modal onClose={() => setResetUser(null)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h2>
            <p className="text-gray-600 mb-4">
              Reset password for: <span className="font-medium">{[resetUser.first_name, resetUser.middle_name, resetUser.last_name].filter(Boolean).join(" ")}</span>
            </p>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition duration-200"
            >
              Update Password
            </button>
          </div>
        </Modal>
      )}
    </div>
    
  );
};

/** ---------------- COMPONENTS ---------------- */
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500"
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition duration-300">
      <div className={`${colorClasses[color]} text-white p-3 rounded-lg text-2xl`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <h2 className="text-3xl font-bold text-gray-900">{value || 0}</h2>
      </div>
    </div>
  );
};

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
      {children}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
      >
        ×
      </button>
    </div>
  </div>
);

export default AdminDashboard;