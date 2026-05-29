/**
 * Authentication Store
 * Zustand state management for auth
 * Security: isAuthenticated is NEVER restored from localStorage.
 * It can only be set to true after a live server-side JWT verification (initAuth).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../services/api.service";
import axiosInstance from "../api/axios.config";

/**
 * Decode a JWT payload WITHOUT verifying signature (client-side only).
 * Used to check token expiry before making a network call.
 */
const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/** Returns true if the JWT is expired (client-side clock check). */
const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  // Add a 10-second buffer to account for clock skew
  return payload.exp * 1000 < Date.now() - 10_000;
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      // NOTE: user and token may be restored from localStorage by `partialize`,
      // but isAuthenticated always starts as false and only becomes true after
      // a successful live server verification in initAuth() or login().
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hydrated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      /**
       * Called by Zustand's onRehydrateStorage once localStorage data is loaded.
       * We intentionally keep isAuthenticated: false here — the user must be
       * re-validated by the server via initAuth() before gaining access.
       */
      setHydrated: () =>
        set({ _hydrated: false, isAuthenticated: false, user: null }),

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

          // Validate that we actually received a token
          if (!token || typeof token !== "string") {
            throw new Error("Invalid server response: no token received");
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem("token", token);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(user));
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

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
            "Login failed. Please check your credentials.";
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
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
          // Silently ignore logout API errors — always clear local state
          console.warn("Logout API call failed (clearing state anyway):", error?.message);
        } finally {
          get().clearAuthState();
        }
      },

      refreshToken: async () => {
        try {
          const storedRefreshToken = localStorage.getItem("refreshToken");
          if (!storedRefreshToken) return false;

          // Check if refresh token itself is expired before making a call
          if (isTokenExpired(storedRefreshToken)) {
            get().clearAuthState();
            return false;
          }

          const response = await authAPI.refreshToken(storedRefreshToken);
          const { token, refreshToken } = response.data;

          if (!token) return false;

          set({ token });
          localStorage.setItem("token", token);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          return true;
        } catch {
          get().clearAuthState();
          return false;
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.updateProfile(data);
          const updatedUser = response.data.user;
          set({ user: updatedUser, isLoading: false, error: null });
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

      /**
       * Initialize auth state by validating the stored token with the server.
       * This is the ONLY way isAuthenticated becomes true after a page reload.
       * Auto-login from localStorage is intentional and secure because:
       *  1. We verify the token is not expired client-side first.
       *  2. We call /auth/me on the server to confirm the session is still valid.
       *  3. If the server rejects the token for any reason, we clear all state.
       */
      initAuth: async () => {
        const token = localStorage.getItem("token");

        // No token stored — clear everything and mark as ready
        if (!token) {
          get().clearAuthState();
          set({ _hydrated: true });
          return;
        }

        // Quick client-side expiry check before hitting the server
        if (isTokenExpired(token)) {
          console.warn("[Auth] Stored token is expired — attempting refresh");
          const refreshed = await get().refreshToken();
          if (!refreshed) {
            set({ _hydrated: true });
            return;
          }
          // After refresh, re-read the new token
          const newToken = localStorage.getItem("token");
          if (!newToken) {
            set({ _hydrated: true });
            return;
          }
        }

        try {
          const freshToken = localStorage.getItem("token");
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${freshToken}`;
          set({ isLoading: true });

          // Server-side verification — the single source of truth
          const response = await authAPI.getCurrentUser();
          const user = response.data?.user;

          if (!user) throw new Error("Server returned no user");

          localStorage.setItem("user", JSON.stringify(user));
          set({
            user,
            token: freshToken,
            isAuthenticated: true, // ← only set here after server confirms session
            isLoading: false,
            error: null,
            _hydrated: true,
          });
        } catch (error) {
          console.warn(
            "[Auth] Session validation failed — clearing state:",
            error?.message || error,
          );
          get().clearAuthState();
          set({ _hydrated: true });
        }
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        // After localStorage data is loaded, immediately reset isAuthenticated.
        // initAuth() will set it back to true only after server validation.
        if (state) state.setHydrated();
      },
      // Only persist the raw token — NOT isAuthenticated or user object.
      // The user object is re-fetched from the server on every page load.
      partialize: (state) => ({
        token: state.token,
      }),
    },
  ),
);

export default useAuthStore;
