/**
 * Quota Guard (Client)
 *
 * Prevents request storms when backend returns 503 with Retry-After
 * (e.g. Firestore RESOURCE_EXHAUSTED mapped to HTTP 503).
 */

const STORAGE_KEY_UNTIL = 'api-quota-blocked-until';
const STORAGE_KEY_REASON = 'api-quota-blocked-reason';

export const getQuotaBlockedUntil = () => {
  const raw = localStorage.getItem(STORAGE_KEY_UNTIL);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

export const getQuotaBlockedRemainingSeconds = () => {
  const untilMs = getQuotaBlockedUntil();
  if (!untilMs) return 0;
  const diff = untilMs - Date.now();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / 1000));
};

export const isQuotaBlockedNow = () => getQuotaBlockedRemainingSeconds() > 0;

export const setQuotaBlockedUntil = (untilMs, reason) => {
  try {
    localStorage.setItem(STORAGE_KEY_UNTIL, String(untilMs || 0));
    if (reason) localStorage.setItem(STORAGE_KEY_REASON, String(reason));
  } catch {
    // ignore storage failures
  }
};

export const clearQuotaBlock = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_UNTIL);
    localStorage.removeItem(STORAGE_KEY_REASON);
  } catch {
    // ignore
  }
};

const parseRetryAfterSeconds = (value) => {
  if (!value) return null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) return Math.floor(asNumber);
  return null;
};

export const attachQuotaGuard = (axiosInstance, { defaultRetryAfterSeconds = 60 } = {}) => {
  if (!axiosInstance?.interceptors) return;

  axiosInstance.interceptors.request.use((config) => {
    const untilMs = getQuotaBlockedUntil();
    if (untilMs && Date.now() < untilMs) {
      const retryAfterSeconds = Math.max(1, Math.ceil((untilMs - Date.now()) / 1000));
      const err = new Error(`Service temporarily unavailable. Retry after ~${retryAfterSeconds}s.`);
      err.name = 'QuotaBlockedError';
      err.status = 503;
      err.isQuotaBlocked = true;
      err.retryAfterSeconds = retryAfterSeconds;
      throw err;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      if (status === 503) {
        const retryAfterHeader =
          error?.response?.headers?.['retry-after'] ??
          error?.response?.headers?.['Retry-After'];

        const secs = parseRetryAfterSeconds(retryAfterHeader) ?? defaultRetryAfterSeconds;
        const untilMs = Date.now() + secs * 1000;
        const reason = error?.response?.data?.message;
        setQuotaBlockedUntil(untilMs, reason);
      }

      return Promise.reject(error);
    }
  );
};
