/**
 * JamatAuthContext
 * Manages session state for a specific Jamat portal.
 * Stored in sessionStorage keyed by slug — fully isolated per portal.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

const getSessionKey = (slug) => `jamat_session_${slug}`;
const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

const JamatAuthContext = createContext(null);

export const JamatAuthProvider = ({ children, slug }) => {
  const SESSION_KEY = getSessionKey(slug);

  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Only restore if slug matches
      return parsed?.slug === slug ? parsed : null;
    } catch {
      return null;
    }
  });

  const inactivityTimer = useRef(null);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    clearTimeout(inactivityTimer.current);
  }, [SESSION_KEY]);

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(clearSession, INACTIVITY_MS);
  }, [clearSession]);

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
        slug: data.slug,
        jamatName: data.jamatName,
        enabledModules: data.enabledModules,
        amount: data.amount || 0,
        paymentStatus: data.paymentStatus || "not_required",
        settings: data.settings || {},
        loginAt: Date.now(),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
      resetInactivityTimer();
    },
    [SESSION_KEY, resetInactivityTimer],
  );

  const updateSettings = useCallback(
    (settings) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, settings };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [SESSION_KEY],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <JamatAuthContext.Provider
      value={{
        isAuthenticated: !!session?.token,
        token: session?.token ?? null,
        slug: session?.slug ?? slug,
        jamatName: session?.jamatName ?? null,
        enabledModules: session?.enabledModules ?? [],
        amount: session?.amount ?? 0,
        paymentStatus: session?.paymentStatus ?? "not_required",
        settings: session?.settings ?? {},
        login,
        logout,
        updateSettings,
      }}
    >
      {children}
    </JamatAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useJamatAuth = () => {
  const ctx = useContext(JamatAuthContext);
  if (!ctx)
    throw new Error("useJamatAuth must be used within JamatAuthProvider");
  return ctx;
};

export default JamatAuthContext;
