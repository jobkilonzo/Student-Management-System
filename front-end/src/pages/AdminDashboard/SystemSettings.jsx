import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const SystemSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    systemName: "St John Paul II Institute",
    allowRegistration: true,
    defaultPassword: "password123",
    sessionTimeout: 60,
    backupFrequency: "daily",
    emailNotifications: true
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="overflow-hidden rounded-[30px] border border-sky-200/80 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(14,116,144,0.6)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-50">
                Administration Controls
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight">System Settings</h1>
              <p className="mt-3 max-w-2xl text-sm text-sky-50/90 sm:text-base">Configure system-wide settings and preferences from a cleaner school-branded workspace.</p>
            </div>
            <button
              onClick={() => navigate("/admin")}
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-sky-800 shadow transition duration-200 hover:bg-sky-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <form onSubmit={handleSave} className="space-y-8">
            {/* General Settings */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Name
                  </label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={e => setSettings({ ...settings, systemName: e.target.value })}
                    className="w-full rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Password
                  </label>
                  <input
                    type="password"
                    value={settings.defaultPassword}
                    onChange={e => setSettings({ ...settings, defaultPassword: e.target.value })}
                    className="w-full rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                    className="w-full rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Self Registration
                  </label>
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={e => setSettings({ ...settings, allowRegistration: e.target.checked })}
                      className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Enable user self-registration</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">System Maintenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={settings.backupFrequency}
                    onChange={e => setSettings({ ...settings, backupFrequency: e.target.value })}
                    className="w-full rounded-2xl border border-sky-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Notifications
                  </label>
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Enable system notifications</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="rounded-2xl border border-sky-200 bg-white px-6 py-3 font-semibold text-sky-700 transition duration-200 hover:bg-sky-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-sky-700 px-6 py-3 font-semibold text-white transition duration-200 disabled:opacity-50 hover:bg-sky-800"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Admin Actions */}
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Administrative Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="rounded-2xl bg-sky-600 px-6 py-4 font-semibold text-white transition duration-200 hover:bg-sky-700">
              Export Data
            </button>
            <button className="rounded-2xl bg-cyan-600 px-6 py-4 font-semibold text-white transition duration-200 hover:bg-cyan-700">
              Backup Database
            </button>
            <button className="rounded-2xl bg-rose-600 px-6 py-4 font-semibold text-white transition duration-200 hover:bg-rose-700">
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
