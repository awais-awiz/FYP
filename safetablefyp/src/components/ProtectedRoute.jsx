import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * ProtectedRoute: Gates content behind authentication and role-based access.
 * * Features:
 * - Bootstrapping check: Prevents "flickering" or false redirects during initial auth check.
 * - Authentication: Redirects unauthenticated users to /login while preserving their intended location.
 * - Authorization: Validates user.role against the allowedRoles array.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  // 1. While the app is initially verifying the token/session, render nothing.
  // This prevents the user from being bounced to /login on every page refresh.
  if (bootstrapping) return null;

  // 2. Redirect to login if the user is not authenticated.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check if the user's role is permitted to access this specific route.
  const hasRequiredRole = allowedRoles && allowedRoles.length > 0 
    ? allowedRoles.includes(user.role) 
    : true;

  if (!hasRequiredRole) {
    // In a production app, you might redirect to an "/unauthorized" page instead.
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;