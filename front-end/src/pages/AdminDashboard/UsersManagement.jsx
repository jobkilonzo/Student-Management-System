import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";

const ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];

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
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingUser) {
        // Update user
        await makeRequest.put(`/auth/users/${editingUser.id}`, {
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          email: form.email,
          role: form.role,
          ...(form.password ? { newPassword: form.password } : {}),
          course_id: form.role === "student" ? form.course_id : undefined,
        });
        toast.success("User updated successfully");
      } else {
        // Create user
        const payload = {
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          role: form.role,
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
      u.last_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <button
            onClick={() => navigate("/admin")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Admin Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="First Name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            required
            className="border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            required
            className="border rounded-lg p-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Middle Name"
            value={form.middle_name}
            onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
            className="border rounded-lg p-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value, course_id: "" })}
            className="border rounded-lg p-2"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder={editingUser ? "New Password (optional)" : "Password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editingUser}
            className="border rounded-lg p-2"
          />
          {form.role === "student" && (
            <select
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              required
              className="border rounded-lg p-2"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_name}
                </option>
              ))}
            </select>
          )}
          <div className="lg:col-span-3 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              {editingUser ? "Update User" : "Create User"}
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg p-2 w-1/2"
          />
          <span className="text-gray-500">{users.length} users found</span>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-2">{`${user.first_name || ""} ${user.middle_name || ""} ${user.last_name || ""}`.trim()}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.role}</td>
                      <td className="p-2">{new Date(user.created_at || user.createdAt || "").toLocaleString()}</td>
                      <td className="p-2 space-x-2">
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
