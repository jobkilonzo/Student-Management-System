import { Navigate } from "react-router-dom";
import { roleRedirect } from "../utils/roleRedirect";

const AuthRedirect = ({ children }) => {
  const token = localStorage.getItem("sms_token");
  const role = localStorage.getItem("sms_role");

  if (token && role) {
    const redirect = roleRedirect[role] || "/";
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default AuthRedirect;