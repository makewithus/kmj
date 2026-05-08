/**
 * UserPortalAuthContext
 * Manages session state for the member/house-owner portal.
 * Stored in sessionStorage — isolated from main app auth.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

const SESSION_KEY = "up_session";
const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

const UserPortalAuthContext = createContext(null);

export const UserPortalAuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

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
        isAuthenticated: !!session?.token,
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
