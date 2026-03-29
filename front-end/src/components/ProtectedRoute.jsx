import { Navigate, useLocation } from "react-router-dom";

const getStoredRole = () => {
  return localStorage.getItem("sms_role");
};

const getToken = () => {
  return localStorage.getItem("sms_token");
};

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation();
  const role = getStoredRole();
  const token = getToken();

  // Not logged in
  if (!token || !role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;