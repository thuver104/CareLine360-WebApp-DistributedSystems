import axios from "axios";
import { clearAuth } from "../auth/authStorage";

const baseURL = import.meta.env.VITE_API_URL;

console.log("API Base URL:", import.meta.env.VITE_API_URL);


export const api = axios.create({ baseURL });

const redirectToLogin = () => {
  const path = window.location.pathname;
  const isPublicAuthPage = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"].includes(path);
  if (!isPublicAuthPage) {
    window.location.replace("/login");
  }
};

// attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const requestUrl = String(original.url || "");
    const isAuthEndpoint = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh");

    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        clearAuth();
        redirectToLogin();
        return Promise.reject(err);
      }

      try {
        const refreshRes = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken", refreshRes.data.accessToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        // Stale tokens are common after secret rotation/redeploy; force a clean login state.
        clearAuth();
        redirectToLogin();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
