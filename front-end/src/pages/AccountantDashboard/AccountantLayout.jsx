import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/accountant/dashboard" },
  { label: "Student Accounts", to: "/accountant/student-accounts" },
  { label: "Collections", to: "/accountant/collections" },
  { label: "Reports", to: "/accountant/reports" },
];

const AccountantLayout = ({ title, subtitle, children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-100">Finance Office</p>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-emerald-50 mt-1">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-teal-800"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
};

export default AccountantLayout;
