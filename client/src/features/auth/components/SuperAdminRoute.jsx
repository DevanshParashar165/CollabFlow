import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route guard that requires the authenticated user to have SUPERADMIN platformRole.
 * Non-superadmins are redirected to /dashboard.
 */
export default function SuperAdminRoute({ children }) {
  const { isAuthenticated, initialized, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">
          Verifying platform privileges...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.platformRole !== 'SUPERADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
