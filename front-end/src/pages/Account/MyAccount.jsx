import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";

const MyAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [passportPreview, setPassportPreview] = useState(null);

  const [me, setMe] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    gender: "",
  });

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await makeRequest.get("/auth/me");
        setMe(res.data);

        try {
          const notifRes = await makeRequest.get("/registrar/notifications", { params: { limit: 10, offset: 0 } });
          setNotifications(notifRes.data.notifications || []);
        } catch (err) {
          console.error(err);
          setNotifications([]);
        }

        const u = res.data?.user || {};
        setProfile({
          first_name: u.first_name || "",
          middle_name: u.middle_name ?? "",
          last_name: u.last_name || "",
          email: u.email || "",
          gender: u.gender || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load account profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const uploadsOrigin = String(makeRequest.defaults.baseURL || "").replace(/\/api\/v1\/?$/, "");
  const passportUrl = me?.user?.passport ? `${uploadsOrigin}/uploads/passports/${me.user.passport}` : null;

  useEffect(() => {
    return () => {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
    };
  }, [passportPreview]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await makeRequest.put("/auth/profile", {
        first_name: profile.first_name,
        middle_name: profile.middle_name,
        last_name: profile.last_name,
        email: profile.email,
        gender: profile.gender || undefined,
      });
      toast.success("Profile updated");
      const res = await makeRequest.get("/auth/me");
      setMe(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    setChanging(true);
    try {
      await makeRequest.post("/auth/change-password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success("Password changed");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Password change failed");
    } finally {
      setChanging(false);
    }
  };

  const uploadPassport = async (file) => {
    if (!file) return;
    setUploadingPassport(true);
    if (passportPreview) URL.revokeObjectURL(passportPreview);
    const localPreview = URL.createObjectURL(file);
    setPassportPreview(localPreview);
    try {
      const fd = new FormData();
      fd.append("passport", file);
      await makeRequest.put("/auth/passport", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Passport uploaded");
      const res = await makeRequest.get("/auth/me");
      setMe(res.data);
      setPassportPreview(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Passport upload failed");
    } finally {
      setUploadingPassport(false);
    }
  };

  const role = localStorage.getItem("sms_role") || "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-6">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-slate-600 shadow-sm">
            Loading...
          </div>
        ) : (
          <>
            <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Personal Details</h2>
              <p className="mt-1 text-sm text-slate-600">
                Update your name, email, and gender. (Student full profile is available under Student → Update Details.)
              </p>

              {role === "student" ? (
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/student/update-details")}
                    className="rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
                  >
                    Open Student Profile Update
                  </button>
                </div>
              ) : null}

              <form onSubmit={saveProfile} className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="First Name" value={profile.first_name} onChange={(v) => setProfile((p) => ({ ...p, first_name: v }))} required />
                <Field label="Middle Name" value={profile.middle_name} onChange={(v) => setProfile((p) => ({ ...p, middle_name: v }))} />
                <Field label="Last Name" value={profile.last_name} onChange={(v) => setProfile((p) => ({ ...p, last_name: v }))} required />
                <Field label="Email" value={profile.email} onChange={(v) => setProfile((p) => ({ ...p, email: v }))} type="email" required />
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Gender</span>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                
                 
                  </select>
                </label>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
              <form onSubmit={changePassword} className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  label="Current Password"
                  value={pw.currentPassword}
                  onChange={(v) => setPw((p) => ({ ...p, currentPassword: v }))}
                  type="password"
                  required
                />
                <div className="hidden md:block" />
                <Field
                  label="New Password"
                  value={pw.newPassword}
                  onChange={(v) => setPw((p) => ({ ...p, newPassword: v }))}
                  type="password"
                  required
                />
                <Field
                  label="Confirm New Password"
                  value={pw.confirmPassword}
                  onChange={(v) => setPw((p) => ({ ...p, confirmPassword: v }))}
                  type="password"
                  required
                />
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changing}
                    className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
                  >
                    {changing ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Passport Photo</h2>
              <p className="mt-1 text-sm text-slate-600">Upload a passport-size photo. It will be used across the system.</p>

              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {passportPreview || passportUrl ? (
                    <img src={passportPreview || passportUrl} alt="Passport" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">No photo</div>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingPassport}
                    onChange={(e) => uploadPassport(e.target.files?.[0])}
                    className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-800 hover:file:bg-sky-200 disabled:opacity-60"
                  />
                  <div className="mt-2 text-xs text-slate-500">{uploadingPassport ? "Uploading..." : "JPG/PNG recommended."}</div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              <p className="mt-1 text-sm text-slate-600">Latest notifications for your role.</p>

              <div className="mt-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    No notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                      <div className="mt-1 text-sm text-slate-700">{n.message}</div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Session</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <KeyVal label="Role" value={me?.user?.role || "—"} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, required, type = "text" }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    />
  </label>
);

const KeyVal = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</div>
    <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

export default MyAccount;
