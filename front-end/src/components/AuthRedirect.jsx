import { Navigate } from "react-router-dom";
import { roleRedirect } from "../utils/roleRedirect";

const AuthRedirect = ({ children }) => {
  const token = localStorage.getItem("sms_token");
  const role = localStorage.getItem("sms_role");
  const mustChange = localStorage.getItem("sms_must_change_password") === "true";

  if (token && role) {
    if (mustChange) {
      return <Navigate to="/change-password" replace />;
    }
    const redirect = roleRedirect[role] || "/";
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default AuthRedirect;
