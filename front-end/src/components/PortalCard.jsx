const PortalCard = ({ title, icon, children }) => (
  <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/40
                  hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
    
    {/* Icon */}
    <div className="flex justify-center mb-4">
      <div className="p-4 rounded-2xl bg-white shadow-md">
        {icon}
      </div>
    </div>

    {/* Title */}
    <h2 className="text-xl font-bold text-slate-800 text-center mb-6">
      {title}
    </h2>

    {/* Items */}
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

export default PortalCard;