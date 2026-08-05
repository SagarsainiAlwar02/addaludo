import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (res) => {
    if (res.data?.success === true && res.data?.data) {
      res.data = { ...res.data.data, _raw: res.data };
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const serverBase = API_BASE.replace(/\/api$/, "");
export const getData = (res) => res.data?.data || res.data;
export const getError = (err) =>
  err.response?.data?.error ||
  err.response?.data?.message ||
  err.response?.data?.msg ||
  err.message ||
  "Something went wrong";

export default API;
