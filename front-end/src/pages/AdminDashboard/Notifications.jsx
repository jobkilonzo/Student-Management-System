import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";

const NOTIFICATION_ROLES = ["admin", "registrar", "student", "accountant", "tutor", "exam_officer"];

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", role: "admin" });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/registrar/notifications");
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications", error);
      toast.error("Could not fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  // Unified Create / Update handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error("Title and message are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        // Update notification
        await makeRequest.patch(`/registrar/notifications/${editingId}`, form);
        toast.success("Notification updated");
        setEditingId(null);
      } else {
        // Create notification
        await makeRequest.post("/registrar/notifications", form);
        toast.success("Notification created");
      }
      setForm({ title: "", message: "", role: "admin" });
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error(editingId ? "Update failed" : "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await makeRequest.delete(`/registrar/notifications/${id}`);
      toast.success("Notification removed");
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  const handleEdit = (notification) => {
    setForm({
      title: notification.title,
      message: notification.message,
      role: notification.role
    });
    setEditingId(notification.id);
    window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to form
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50 p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <button
            onClick={() => navigate("/admin")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Admin Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="border rounded-lg p-2"
            required
          />
          <input
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Message"
            className="border rounded-lg p-2"
            required
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border rounded-lg p-2"
          >
            {NOTIFICATION_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg md:col-span-3"
          >
            {loading ? "Saving..." : editingId ? "Update Notification" : "Create Notification"}
          </button>
        </form>

        <div className="overflow-auto">
          {loading ? (
            <p>Loading notifications...</p>
          ) : (
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Message</th>
                  <th className="p-2 text-left">Target Role</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No notifications yet.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="p-2">{new Date(n.createdAt || n.created_at).toLocaleString()}</td>
                      <td className="p-2">{n.title}</td>
                      <td className="p-2">{n.message}</td>
                      <td className="p-2">{n.role}</td>
                      <td className="p-2 flex gap-2">
                        <button
                          onClick={() => handleEdit(n)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
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

export default Notifications;