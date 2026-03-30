import { useNavigate } from "react-router-dom";

const StudentPortalLayout = ({
  title,
  subtitle,
  backTo = "/student/dashboard",
  backLabel = "Back to Dashboard",
  actions,
  children,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_38%,_#f8fafc_72%)]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-200/70 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 text-white shadow-[0_25px_80px_-35px_rgba(14,116,144,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.24),_transparent_28%)]" />
          <div className="relative flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
                Student Portal
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {backTo && (
                <button
                  onClick={() => navigate(backTo)}
                  className="rounded-2xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  {backLabel}
                </button>
              )}
              <button
                onClick={() => navigate("/student/dashboard")}
                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
              >
                Dashboard Home
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        {actions ? <div>{actions}</div> : null}

        <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          {children}
        </section>
      </div>
    </div>
  );
};

export default StudentPortalLayout;
