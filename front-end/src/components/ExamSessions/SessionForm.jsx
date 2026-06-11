import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const SessionForm = ({ initial = {}, onCancel, onSave }) => {
  const [session, setSession] = useState({
    session_name: "",
    start_time: "08:00:00",
    end_time: "10:00:00",
    display_order: 0,
    is_active: true,
    ...initial,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setSession((s) => ({ ...s, ...initial }));
    setErrors({});
  }, [initial]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSession((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!session.session_name || String(session.session_name).trim().length < 3) {
      nextErrors.session_name = "Session name must be at least 3 characters.";
    }
    if (!session.start_time) {
      nextErrors.start_time = "Start time is required.";
    }
    if (!session.end_time) {
      nextErrors.end_time = "End time is required.";
    }
    if (session.start_time && session.end_time && session.start_time >= session.end_time) {
      nextErrors.start_time = "Start time must be before end time.";
      nextErrors.end_time = "End time must be after start time.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      Object.values(nextErrors).forEach((message) => toast.error(message));
      return;
    }

    onSave(session);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">Session name</label>
        <input
          name="session_name"
          value={session.session_name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border px-3 py-2 ${errors.session_name ? "border-rose-500 bg-rose-50" : "border-slate-300"}`}
        />
        {errors.session_name && <p className="mt-1 text-sm text-rose-600">{errors.session_name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Start time</label>
          <input
            name="start_time"
            type="time"
            value={session.start_time?.slice(0, 5) || "08:00"}
            onChange={(e) => handleChange({ target: { name: "start_time", value: `${e.target.value}:00`, type: "text" } })}
            className={`mt-1 block w-full rounded-md border px-3 py-2 ${errors.start_time ? "border-rose-500 bg-rose-50" : "border-slate-300"}`}
          />
          {errors.start_time && <p className="mt-1 text-sm text-rose-600">{errors.start_time}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">End time</label>
          <input
            name="end_time"
            type="time"
            value={session.end_time?.slice(0, 5) || "10:00"}
            onChange={(e) => handleChange({ target: { name: "end_time", value: `${e.target.value}:00`, type: "text" } })}
            className={`mt-1 block w-full rounded-md border px-3 py-2 ${errors.end_time ? "border-rose-500 bg-rose-50" : "border-slate-300"}`}
          />
          {errors.end_time && <p className="mt-1 text-sm text-rose-600">{errors.end_time}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Display order</label>
          <input
            name="display_order"
            type="number"
            value={session.display_order || 0}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border px-3 py-2 border-slate-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" name="is_active" type="checkbox" checked={!!session.is_active} onChange={handleChange} />
          <label htmlFor="active" className="text-sm text-slate-700">Active</label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
        <button type="submit" className="px-3 py-2 rounded bg-slate-900 text-white">Save</button>
      </div>
    </form>
  );
};

export default SessionForm;
