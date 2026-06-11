import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Clean broken sessions
const token = localStorage.getItem("sms_token");

if (!token) {
  localStorage.removeItem("sms_role");
  localStorage.removeItem("sms_user");
  localStorage.removeItem("sms_must_change_password");
}

window.addEventListener("storage", (event) => {
  if (event.key === "sms_token" && !event.newValue) {
    localStorage.removeItem("sms_role");
    localStorage.removeItem("sms_user");
    localStorage.removeItem("sms_must_change_password");
    window.location.replace("/login");
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);