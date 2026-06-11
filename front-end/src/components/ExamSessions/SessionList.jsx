import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SessionForm from "./SessionForm";

const SessionList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await makeRequest.get("/exam-sessions");
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const onEdit = (s) => { setEditing(s); setShowForm(true); };

  const onSave = async (payload) => {
    try {
      if (editing && editing.id) {
        await makeRequest.put(`/exam-sessions/${editing.id}`, payload);
        toast.success('Session updated');
      } else {
        await makeRequest.post(`/exam-sessions`, payload);
        toast.success('Session created');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to save');
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this session?')) return;
    try {
      await makeRequest.delete(`/exam-sessions/${id}`);
      toast.success('Session deleted');
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to delete');
    }
  };

  const toggleActive = async (s) => {
    try {
      await makeRequest.put(`/exam-sessions/${s.id}`, { is_active: !s.is_active });
      toast.success('Session updated');
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Exam Sessions</h3>
        <div>
          <button onClick={onCreate} className="px-3 py-2 rounded bg-slate-900 text-white">New Session</button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 bg-white rounded border">Loading...</div>
      ) : (
        <div className="bg-white rounded border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Session</th>
                <th className="px-4 py-2">Start</th>
                <th className="px-4 py-2">End</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2">{s.display_order}</td>
                  <td className="px-4 py-2">{s.session_name}</td>
                  <td className="px-4 py-2">{s.start_time}</td>
                  <td className="px-4 py-2">{s.end_time}</td>
                  <td className="px-4 py-2">{s.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(s)} className="px-2 py-1 rounded border">Edit</button>
                      <button onClick={() => toggleActive(s)} className="px-2 py-1 rounded border">Toggle</button>
                      <button onClick={() => onDelete(s.id)} className="px-2 py-1 rounded border text-rose-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h4 className="font-bold mb-3">{editing ? 'Edit Session' : 'New Session'}</h4>
            <SessionForm initial={editing || {}} onCancel={() => setShowForm(false)} onSave={onSave} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionList;
