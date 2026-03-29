import axios from "axios";

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
