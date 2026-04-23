import { Navigate, useLocation } from "react-router-dom";

const getStoredRole = () => {
  return localStorage.getItem("sms_role");
};

const getToken = () => {
  return localStorage.getItem("sms_token");
};

const mustChangePassword = () => {
  return localStorage.getItem("sms_must_change_password") === "true";
};

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation();
  const role = getStoredRole();
  const token = getToken();

  // Not logged in
  if (!token || !role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Force password change before accessing anything else
  if (mustChangePassword() && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Role not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
