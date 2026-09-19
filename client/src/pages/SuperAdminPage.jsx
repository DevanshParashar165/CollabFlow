import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center space-x-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white text-xl shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-white text-2xl font-bold">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  const { user } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersMeta, setUsersMeta] = useState({});
  const [wsPage, setWsPage] = useState(1);
  const [wsMeta, setWsMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('users');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, wRes] = await Promise.all([
        api.get(`${API_ENDPOINTS.SUPERADMIN_USERS}?page=${usersPage}&limit=10`),
        api.get(`${API_ENDPOINTS.SUPERADMIN_WORKSPACES}?page=${wsPage}&limit=10`),
      ]);
      setUsers(uRes.data.data.users || []);
      setUsersMeta(uRes.data.data.pagination || {});
      setWorkspaces(wRes.data.data.workspaces || []);
      setWsMeta(wRes.data.data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load superadmin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This effect synchronizes the view with the paginated API response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPage, wsPage]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">SuperAdmin Portal</h1>
              <p className="text-slate-400 text-sm">Logged in as <span className="text-violet-400 font-medium">{user?.email}</span></p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={usersMeta.total}
            color="bg-indigo-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Workspaces"
            value={wsMeta.total}
            color="bg-violet-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatCard
            label="Platform Role"
            value={user?.platformRole}
            color="bg-fuchsia-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-800 mb-6">
          {['users', 'workspaces'].map((t) => (
            <button
              key={t}
              id={`superadmin-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-all cursor-pointer border-b-2 -mb-px ${
                tab === t
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Users table */}
            {tab === 'users' && (
              <div>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Name</th>
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Email</th>
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Platform Role</th>
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                            <td className="px-5 py-3 text-white font-medium">{u.name}</td>
                            <td className="px-5 py-3 text-slate-400">{u.email}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                                u.platformRole === 'SUPERADMIN'
                                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }`}>
                                {u.platformRole}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-500 text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-slate-500">No users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {usersMeta.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-slate-500 text-xs">
                      Page {usersPage} of {usersMeta.pages} · {usersMeta.total} total
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                        disabled={usersPage <= 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs cursor-pointer"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setUsersPage((p) => Math.min(usersMeta.pages, p + 1))}
                        disabled={usersPage >= usersMeta.pages}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Workspaces table */}
            {tab === 'workspaces' && (
              <div>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Name</th>
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Slug</th>
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Owner</th>
                          <th className="text-left px-5 py-3 text-slate-400 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspaces.map((ws) => (
                          <tr key={ws._id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                            <td className="px-5 py-3 text-white font-medium">{ws.name}</td>
                            <td className="px-5 py-3 text-slate-400 font-mono text-xs">/{ws.slug}</td>
                            <td className="px-5 py-3 text-slate-400">{ws.createdBy?.name || ws.createdBy?.email || '—'}</td>
                            <td className="px-5 py-3 text-slate-500 text-xs">
                              {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                        {workspaces.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-slate-500">No workspaces found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {wsMeta.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-slate-500 text-xs">
                      Page {wsPage} of {wsMeta.pages} · {wsMeta.total} total
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setWsPage((p) => Math.max(1, p - 1))}
                        disabled={wsPage <= 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs cursor-pointer"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setWsPage((p) => Math.min(wsMeta.pages, p + 1))}
                        disabled={wsPage >= wsMeta.pages}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
