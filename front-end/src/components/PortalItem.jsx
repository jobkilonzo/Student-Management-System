import { useNavigate } from "react-router-dom";

const PortalItem = ({ label, to, description, icon }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(to)}
      className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition cursor-pointer"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {label}
      </h3>
      <p className="text-sm text-gray-600">
        {description}
      </p>
      <div className="mt-4 text-blue-600 font-medium text-sm">
        Open →
      </div>
    </div>
  );
};

export default PortalItem;