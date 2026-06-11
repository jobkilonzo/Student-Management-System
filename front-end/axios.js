import axios from "axios";

const clearAuthStorage = () => {
  localStorage.removeItem("sms_token");
  localStorage.removeItem("sms_role");
  localStorage.removeItem("sms_user");
  localStorage.removeItem("sms_must_change_password");
};

const redirectToLogin = () => {
  clearAuthStorage();
  window.location.replace("/login");
};

export const makeRequest = axios.create({
  baseURL: "http://localhost:3000/api/v1/",
  withCredentials: true,
});

// Automatically attach token to every request
makeRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem("sms_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

makeRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
