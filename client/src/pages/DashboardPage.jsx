import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import authService from '../features/auth/authService';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [testStatus, setTestStatus] = useState({
    loading: false,
    result: null,
    statusCode: null,
    error: false,
  });

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleTestAdminRoute = async () => {
    setTestStatus({ loading: true, result: null, statusCode: null, error: false });
    try {
      const response = await authService.testAdminRole();
      setTestStatus({
        loading: false,
        result: response.message || 'Access granted (Admin / Owner role confirmed)',
        statusCode: 200,
        error: false,
      });
    } catch (err) {
      setTestStatus({
        loading: false,
        result:
          err.response?.data?.message ||
          'Forbidden: Role lacks permission to access this resource.',
        statusCode: err.response?.status || 500,
        error: true,
      });
    }
  };

  // Helper for role badge color styling
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MEMBER':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'VIEWER':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const userInitials = user?.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'U';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Profile Section */}
      <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg shadow-indigo-500/25 border border-white/10">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {user?.name || 'CollabFlow User'}
                </h1>
                <span
                  id="user-role-badge"
                  className={`text-xs px-3 py-1 rounded-full font-semibold border ${getRoleBadgeStyle(
                    user?.role
                  )}`}
                >
                  {user?.role || 'MEMBER'}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
              <p className="text-xs text-slate-500 mt-1">
                Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </p>
            </div>
          </div>

          <button
            id="dashboard-logout-btn"
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-medium text-sm transition-all duration-200 cursor-pointer flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Grid of Status & Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication State Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3 text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h2 className="text-base font-semibold text-white">Active Session Details</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-slate-200 text-xs">{user?._id || user?.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Authentication Method</span>
              <span className="text-slate-200 font-medium">JWT (HTTP-Only Cookie)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Token Storage</span>
              <span className="text-emerald-400 font-medium text-xs">Secure / Inaccessible to JS</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Assigned Role</span>
              <span className="text-indigo-400 font-semibold">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Privilege Escalation Defense Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3 text-violet-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-base font-semibold text-white">Role Security & Boundaries</h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            All self-registered users receive the <strong className="text-slate-200">MEMBER</strong> role by default.
            CollabFlow strips and discards any client-supplied role attributes during registration, preventing users from granting themselves elevated privileges.
          </p>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center space-x-2 text-indigo-400 font-medium mb-1">
              <span>Next Phase (Workspaces):</span>
            </div>
            When a user creates an organizational workspace in Phase 3, they will automatically be assigned as that workspace&apos;s OWNER through trusted server workflows.
          </div>
        </div>
      </div>

      {/* Interactive RBAC Verification Card */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Role-Based Authorization (RBAC) Test</h2>
            <p className="text-sm text-slate-400 mt-1">
              Verify backend authorization enforcement against <code className="text-indigo-400 text-xs font-mono">GET /api/auth/admin-test</code> (Requires OWNER or ADMIN).
            </p>
          </div>

          <button
            id="test-rbac-btn"
            onClick={handleTestAdminRoute}
            disabled={testStatus.loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap"
          >
            {testStatus.loading ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Test Role Endpoint</span>
              </>
            )}
          </button>
        </div>

        {/* Live Test Feedback Banner */}
        {testStatus.result && (
          <div
            id="rbac-test-result"
            className={`p-4 rounded-xl border text-sm flex items-start space-x-3 transition-all duration-200 ${testStatus.error
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {testStatus.error ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold">
                Status: {testStatus.statusCode} {testStatus.error ? 'Forbidden' : 'OK'}
              </p>
              <p className="mt-0.5 text-xs opacity-90">{testStatus.result}</p>
              {testStatus.error && (
                <p className="mt-1 text-[11px] text-amber-200/80">
                  Expected outcome: The backend <code className="font-mono text-xs">authorizeRoles</code> middleware successfully verified that your role ({user?.role}) does not have administrative rights, protecting the route.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
