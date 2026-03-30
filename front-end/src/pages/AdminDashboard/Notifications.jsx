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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
              Communications
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="mt-2 text-sm text-slate-600">Create, update, and review role-based notifications from one admin page.</p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Back to Admin Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="rounded-2xl border border-sky-200 p-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            required
          />
          <input
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Message"
            className="rounded-2xl border border-sky-200 p-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            required
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-2xl border border-sky-200 p-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
            className="rounded-2xl bg-sky-700 px-4 py-3 text-white transition hover:bg-sky-800 md:col-span-3"
          >
            {loading ? "Saving..." : editingId ? "Update Notification" : "Create Notification"}
          </button>
        </form>

        <div className="overflow-auto">
          {loading ? (
            <p className="p-8 text-center text-slate-500">Loading notifications...</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-100/80">
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
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No notifications yet.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="bg-white transition hover:bg-sky-50/60">
                      <td className="p-2">{new Date(n.createdAt || n.created_at).toLocaleString()}</td>
                      <td className="p-2">{n.title}</td>
                      <td className="p-2">{n.message}</td>
                      <td className="p-2">{n.role}</td>
                      <td className="p-2 flex gap-2">
                        <button
                          onClick={() => handleEdit(n)}
                          className="rounded-xl bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
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
