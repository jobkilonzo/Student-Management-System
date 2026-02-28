 const PortalItem = ({ label }) => (
  <div className="group rounded-xl border border-slate-200 bg-white px-4 py-3
                  hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-between">
    <span className="text-slate-700 font-medium">
      {label}
    </span>
    <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition">
      →
    </span>
  </div>
);
export default PortalItem;