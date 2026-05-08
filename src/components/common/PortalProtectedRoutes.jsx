/**
 * Portal Protected Routes
 * Guards for User Portal and Jamat Portal routes
 */

import { Navigate, useParams } from "react-router-dom";
import { useUserPortalAuth } from "../../context/UserPortalAuthContext";
import { useJamatAuth } from "../../context/JamatAuthContext";

/**
 * Protect User Portal routes — redirect to login if not authenticated
 */
export const UserPortalProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUserPortalAuth();
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
  const { isAuthenticated } = useJamatAuth();
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to={`/${slug}/login`} replace />
  );
};
