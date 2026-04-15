import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

console.log("API Base URL:", import.meta.env.VITE_API_URL);


export const api = axios.create({ baseURL });

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
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return Promise.reject(err);

      const refreshRes = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      localStorage.setItem("accessToken", refreshRes.data.accessToken);

      original.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
      return api(original);
    }
    return Promise.reject(err);
  }
);

export default api;
