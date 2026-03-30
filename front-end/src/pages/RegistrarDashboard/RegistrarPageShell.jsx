import { useNavigate } from "react-router-dom";

const RegistrarPageShell = ({
  title,
  subtitle,
  children,
  showBack = true,
  backLabel = "Back",
  actions = null,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_34%,_#f8fafc_78%)] p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[32px] border border-sky-100 bg-white/90 px-6 py-6 shadow-[0_20px_60px_-40px_rgba(14,116,144,0.45)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              {showBack && (
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {backLabel}
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-950/70 sm:text-base">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default RegistrarPageShell;
