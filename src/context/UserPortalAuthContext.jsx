/**
 * UserPortalAuthContext
 * Manages session state for the member/house-owner portal.
 * Stored in sessionStorage — isolated from main app auth.
 *
 * Security: On app init, the stored token is validated server-side
 * before isAuthenticated is set to true.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axiosInstance from "../api/axios.config";

const SESSION_KEY = "up_session";
const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

const UserPortalAuthContext = createContext(null);

/**
 * Validate the user portal JWT with the server by calling a protected endpoint.
 * Returns true if the token is still valid.
 */
const verifyUserPortalToken = async (token) => {
  try {
    await axiosInstance.get("/portal/user/family", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch {
    return false;
  }
};

export const UserPortalAuthProvider = ({ children }) => {
  // Start unauthenticated — we verify before granting access
  const [session, setSession] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const inactivityTimer = useRef(null);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    clearTimeout(inactivityTimer.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(clearSession, INACTIVITY_MS);
  }, [clearSession]);

  /**
   * On mount: check sessionStorage for a saved session and verify
   * its JWT token with the server before allowing access.
   */
  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) {
          if (!cancelled) setIsVerifying(false);
          return;
        }

        const parsed = JSON.parse(raw);

        // Basic structure check
        if (!parsed?.token || typeof parsed.token !== "string") {
          sessionStorage.removeItem(SESSION_KEY);
          if (!cancelled) setIsVerifying(false);
          return;
        }

        // Server-side token verification
        const valid = await verifyUserPortalToken(parsed.token);
        if (cancelled) return;

        if (valid) {
          setSession(parsed);
        } else {
          // Stale / revoked token — remove session
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    };

    initSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track activity to reset timeout
  useEffect(() => {
    if (!session) return;
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, resetInactivityTimer),
      );
      clearTimeout(inactivityTimer.current);
    };
  }, [session, resetInactivityTimer]);

  const login = useCallback(
    (data) => {
      if (!data?.token || typeof data.token !== "string") {
        console.error("[UserPortalAuth] login() called without a valid token");
        return;
      }
      const newSession = {
        token: data.token,
        member: data.member,
        loginAt: Date.now(),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
      resetInactivityTimer();
    },
    [resetInactivityTimer],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <UserPortalAuthContext.Provider
      value={{
        isAuthenticated: !isVerifying && !!session?.token,
        isVerifying,
        token: session?.token ?? null,
        member: session?.member ?? null,
        login,
        logout,
      }}
    >
      {children}
    </UserPortalAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserPortalAuth = () => {
  const ctx = useContext(UserPortalAuthContext);
  if (!ctx)
    throw new Error(
      "useUserPortalAuth must be used within UserPortalAuthProvider",
    );
  return ctx;
};

export default UserPortalAuthContext;
