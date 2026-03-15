import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const getStoredRole = () => {
  return localStorage.getItem("sms_role");
};

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const role = getStoredRole();

    if (!role) {
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      navigate("/login", { replace: true });
    }
  }, [allowedRoles, location, navigate]);

  return children;
};

export default ProtectedRoute;
