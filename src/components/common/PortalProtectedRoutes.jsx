import { Navigate, useParams } from "react-router-dom";
import { useUserPortalAuth } from "../../context/UserPortalAuthContext";
import { useJamatAuth } from "../../context/JamatAuthContext";
import { PageLoader } from "./Loading";

/**
 * Protect User Portal routes — redirect to login if not authenticated
 */
export const UserPortalProtectedRoute = ({ children }) => {
  const { isAuthenticated, isVerifying } = useUserPortalAuth();

  if (isVerifying) {
    return <PageLoader message="Verifying session..." />;
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/user-portal/login" replace />
  );
};

/**
 * Protect Jamat Portal routes — redirect to /:slug/login if not authenticated
 */
export const JamatProtectedRoute = ({ children }) => {
  const { slug } = useParams();
  const { isAuthenticated, isVerifying } = useJamatAuth();

  if (isVerifying) {
    return <PageLoader message="Verifying session..." />;
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to={`/${slug}/login`} replace />
  );
};

