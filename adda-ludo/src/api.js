import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(response);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getData = (res) => res.data?.data || res.data;
export const getMessage = (res) => res.data?.message || res.data?.msg || "";
export const getError = (err) =>
  err.response?.data?.error ||
  err.response?.data?.message ||
  err.response?.data?.msg ||
  err.message ||
  "Something went wrong";

export default api;
