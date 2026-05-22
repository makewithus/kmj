/**
 * Authentication Store
 * Zustand state management for auth
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../services/api.service";
import axiosInstance from "../api/axios.config";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hydrated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setHydrated: () => set({ _hydrated: false, isAuthenticated: false }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }
        set({ token });
      },

      clearAuthState: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("auth-storage");
        delete axiosInstance.defaults.headers.common["Authorization"];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          // API returns: { success, message, data: { user, token, refreshToken } }
          const { user, token, refreshToken } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(user));
          axiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;

          return { success: true, user };
        } catch (error) {
          const responseData = error.response?.data;
          const validationDetails = Array.isArray(responseData?.errors)
            ? responseData.errors
                .map((e) => e.message)
                .filter(Boolean)
                .join(", ")
            : null;
          const errorMessage =
            validationDetails ||
            responseData?.message ||
            error.message ||
            "Login failed";
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
          // API returns: { success, message, data: { user, token, refreshToken } }
          const { user } = response.data;

          set({ isLoading: false, error: null });

          return { success: true, user, message: response.message };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Registration failed";
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          get().clearAuthState();
        }
      },

      refreshToken: async () => {
        try {
          const storedRefreshToken = localStorage.getItem("refreshToken");
          if (!storedRefreshToken) return false;

          const response = await authAPI.refreshToken(storedRefreshToken);
          // API returns: { success, data: { token, refreshToken } }
          const { token, refreshToken } = response.data;

          set({ token });
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refreshToken);
          axiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;

          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.updateProfile(data);
          // API returns: { success, data: { user } }
          const updatedUser = response.data.user;

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });

          localStorage.setItem("user", JSON.stringify(updatedUser));

          return { success: true, user: updatedUser };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || error.message || "Update failed";
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      changePassword: async (passwords) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.changePassword(passwords);
          set({ isLoading: false, error: null });
          return { success: true, message: response.message };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Password change failed";
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Check if user is admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === "admin";
      },

      // Initialize auth from localStorage
      initAuth: async () => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
          get().clearAuthState();
          set({ _hydrated: true });
          return;
        }

        try {
          JSON.parse(userStr);
          axiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;
          set({ isLoading: true, token });

          const response = await authAPI.getCurrentUser();
          const user = response.data?.user;

          if (!user) throw new Error("Invalid session");

          localStorage.setItem("user", JSON.stringify(user));
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            _hydrated: true,
          });
        } catch (error) {
          console.error("Stored login session is no longer valid:", error);
          get().clearAuthState();
          set({ _hydrated: true });
        }
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);

export default useAuthStore;
