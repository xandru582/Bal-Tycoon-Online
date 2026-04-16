import { create } from "zustand";
import api from "../lib/api";
import { getSocket, disconnectSocket } from "../lib/socket";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  character_id?: string;
  clan_id?: string;
  clan_name?: string;
  clan_tag?: string;
  clan_color?: string;
  credits?: number;
  net_worth?: number;
  prestige_level?: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, character_id?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("nexus_access_token"),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, refresh_token, user } = res.data;
      localStorage.setItem("nexus_access_token", access_token);
      localStorage.setItem("nexus_refresh_token", refresh_token);
      set({ user, isAuthenticated: true, isLoading: false });
      // Connect socket after login
      getSocket();
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Error al iniciar sesión", isLoading: false });
    }
  },

  register: async (username, email, password, character_id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/register", { username, email, password, character_id });
      const { access_token, refresh_token, user } = res.data;
      localStorage.setItem("nexus_access_token", access_token);
      localStorage.setItem("nexus_refresh_token", refresh_token);
      set({ user, isAuthenticated: true, isLoading: false });
      getSocket();
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Error al registrarse", isLoading: false });
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("nexus_refresh_token");
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch {}
    localStorage.removeItem("nexus_access_token");
    localStorage.removeItem("nexus_refresh_token");
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    if (!localStorage.getItem("nexus_access_token")) return;
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, isAuthenticated: true });
    } catch {
      // Token expired/invalid — clear auth
      localStorage.removeItem("nexus_access_token");
      localStorage.removeItem("nexus_refresh_token");
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
