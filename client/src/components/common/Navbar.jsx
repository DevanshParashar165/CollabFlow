import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { APP_NAME } from '../../utils/constants';
import { logoutUser } from '../../features/auth/authSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg tracking-wider">CF</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Auth v0.2
          </span>
        </div>

        <nav className="flex items-center space-x-4 sm:space-x-6 text-sm">
          <Link
            to="/"
            className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
          >
            Overview
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Dashboard
              </Link>
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium text-slate-200">
                    {user?.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {user?.role || 'MEMBER'}
                  </span>
                </div>
                <button
                  id="navbar-logout-btn"
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                id="navbar-login-link"
                to="/login"
                className="text-slate-300 hover:text-white transition-colors duration-200 font-medium text-sm"
              >
                Sign In
              </Link>
              <Link
                id="navbar-register-link"
                to="/register"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
