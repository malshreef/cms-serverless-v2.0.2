import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessRoute } from '../lib/permissions';

/**
 * Protected route component that checks user permissions
 * Redirects to dashboard if user doesn't have access
 */
const ProtectedRoute = ({ children, permPath }) => {
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-cta"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has permission to access this route
  const role = user?.role || 'viewer';
  const hasAccess = canAccessRoute(role, permPath);

  if (!hasAccess) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
