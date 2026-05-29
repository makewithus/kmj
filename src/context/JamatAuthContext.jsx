/**
 * JamatAuthContext
 * Manages session state for a specific Jamat portal.
 * Stored in sessionStorage keyed by slug — fully isolated per portal.
 *
 * Security: On app init, the stored token is validated server-side.
 * isAuthenticated is NEVER set to true from sessionStorage alone.
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

const getSessionKey = (slug) => `jamat_session_${slug}`;
const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

const JamatAuthContext = createContext(null);

/**
 * Validate a Jamat portal JWT with the server.
 * Returns true if the token is still valid for this slug.
 */
const verifyJamatToken = async (slug, token) => {
  try {
    await axiosInstance.get(`/portal/jamat/${slug}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch {
    return false;
  }
};

export const JamatAuthProvider = ({ children, slug }) => {
  const SESSION_KEY = getSessionKey(slug);

  // Start with null (unauthenticated) — we verify the stored session first
  const [session, setSession] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);

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

  /**
   * On mount: check if a session is stored in sessionStorage and
   * validate its token with the server before allowing access.
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

        // Basic integrity check
        if (!parsed?.token || parsed?.slug !== slug) {
          sessionStorage.removeItem(SESSION_KEY);
          if (!cancelled) setIsVerifying(false);
          return;
        }

        // Server-side token verification
        const valid = await verifyJamatToken(slug, parsed.token);
        if (cancelled) return;

        if (valid) {
          setSession(parsed);
        } else {
          // Token rejected by server — clear stale session
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
  }, [SESSION_KEY, slug]);

  // Activity-based inactivity timer
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
        console.error("[JamatAuth] login() called without a valid token");
        return;
      }
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
        isAuthenticated: !isVerifying && !!session?.token,
        isVerifying,
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
