import { useNavigate } from "react-router-dom";

const RegistrarActionCard = ({ label, to, description, icon }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(to)}
      className="group cursor-pointer rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_22px_50px_-34px_rgba(14,116,144,0.55)]"
    >
      <div className="mb-4 inline-flex rounded-2xl bg-sky-100 px-4 py-3 text-3xl text-sky-700 shadow-sm">
        {icon}
      </div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
        Registrar Access
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900">{label}</h3>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 text-sm font-semibold text-sky-700 transition group-hover:translate-x-1">
        {"Open ->"}
      </div>
    </div>
  );
};

export default RegistrarActionCard;
