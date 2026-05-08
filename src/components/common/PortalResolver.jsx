/**
 * PortalResolver
 * Handles dynamic /:slug route — checks if portal exists,
 * redirects to /:slug/login or shows 404
 */

import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { checkJamatExistsAPI } from "../../services/portalService";

const PortalResolver = () => {
  const { slug } = useParams();
  const [status, setStatus] = useState("loading"); // loading | found | notfound

  useEffect(() => {
    let cancelled = false;
    checkJamatExistsAPI(slug)
      .then((res) => {
        // Axios interceptor returns response.data directly, so res = { success, exists, jamatName }
        if (!cancelled) setStatus(res.exists ? "found" : "notfound");
      })
      .catch(() => {
        // On network error assume portal exists — let login page handle it
        if (!cancelled) setStatus("found");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-sm">Resolving portal…</span>
        </div>
      </div>
    );
  }

  if (status === "found") {
    return <Navigate to={`/${slug}/login`} replace />;
  }

  // 404
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-neutral-900">404</h1>
        <p className="text-2xl text-neutral-600 mt-4">Portal Not Found</p>
        <p className="text-gray-400 mt-2 text-sm">
          No portal exists for{" "}
          <code className="bg-gray-100 px-2 py-0.5 rounded">{slug}</code>
        </p>
        <a
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-[#31757A] text-white rounded-lg hover:bg-[#276165] transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default PortalResolver;
