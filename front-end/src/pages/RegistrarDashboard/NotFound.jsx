import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_40%,_#f8fafc_78%)] p-6">
      <h1 className="mb-4 text-6xl font-bold text-sky-700">404</h1>
      <p className="mb-6 text-xl text-slate-700">Page Not Found</p>
      <button
        onClick={() => navigate("/")}
        className="rounded-2xl bg-sky-600 px-6 py-3 text-white transition hover:bg-sky-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
