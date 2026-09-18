import { useSelector } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

/**
 * Route guard for pages requiring an active, authenticated user session.
 * Displays an elegant branded loader while verifying authentication on initial load,
 * preventing flash of unauthorized state.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  // Show loading indicator until the initial /auth/me cookie check completes
  if (!initialized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">
          Verifying session...
        </p>
      </div>
    );
  }

  // If unauthenticated after check completes, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
