import { useNavigate, useLocation } from "react-router-dom";
import { makeRequest } from "../../../axios";

const links = [
  { label: "Home", to: "/secretary" },
  { label: "Manage Students", to: "/secretary/students" },
  { label: "Course Enrollment", to: "/secretary/enrollment" },
  { label: "Fee Payments", to: "/secretary/fee-payments" },
  { label: "Reports", to: "/secretary/reports" },
  { label: "Notifications", to: "/secretary/notifications" },
  { label: "My Account", to: "/account" },
];

const SecretaryShell = ({ title, subtitle, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await makeRequest.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("sms_token");
      localStorage.removeItem("sms_role");
      localStorage.removeItem("sms_user");
      localStorage.removeItem("sms_must_change_password");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_34%,_#f8fafc_78%)]">
      <div className="mx-auto max-w-7xl px-1 py-2 sm:px-1 lg:px-1">
        <div className="grid gap-2 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            <div className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Secretary Portal
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900">Navigation</div>
            </div>

            <nav className="space-y-2">
              {links.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <button
                    key={l.to}
                    onClick={() => navigate(l.to)}
                    className={`w-full rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition ${
                      active ? "bg-sky-100 text-sky-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6">
              <button
                onClick={handleLogout}
                className="w-full rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Logout
              </button>
            </div>
          </aside>

          <main className="space-y-6">
            <header className="rounded-[28px] border border-sky-100 bg-white/90 px-6 py-6 shadow-[0_20px_60px_-40px_rgba(14,116,144,0.45)] backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
                  {subtitle ? (
                    <p className="mt-2 text-sm text-sky-950/70 sm:text-base">{subtitle}</p>
                  ) : null}
                </div>
              </div>
            </header>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SecretaryShell;
