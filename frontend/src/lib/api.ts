import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: añadir JWT ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexus_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: refresh automático si 401 ──────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("nexus_refresh_token");
      if (!refreshToken) {
        // No hay refresh token → logout
        localStorage.removeItem("nexus_access_token");
        localStorage.removeItem("nexus_refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        const { access_token, refresh_token } = res.data;
        localStorage.setItem("nexus_access_token", access_token);
        localStorage.setItem("nexus_refresh_token", refresh_token);
        processQueue(null, access_token);
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("nexus_access_token");
        localStorage.removeItem("nexus_refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
