import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSystemHealth } from '../store/slices/systemSlice';
import useSocket from '../hooks/useSocket';
import StatusBadge from '../components/common/StatusBadge';
import { APP_NAME, APP_DESCRIPTION } from '../utils/constants';

export default function HomePage() {
  const dispatch = useDispatch();
  const { healthStatus, healthData, error } = useSelector((state) => state.system);
  const { isConnected, connect, disconnect } = useSocket(false);

  useEffect(() => {
    dispatch(fetchSystemHealth());
  }, [dispatch]);

  const handleRefreshHealth = () => {
    dispatch(fetchSystemHealth());
  };

  const stackItems = [
    { name: 'React 19 & Vite', category: 'Frontend Engine', status: 'Active' },
    { name: 'Tailwind CSS v4', category: 'Styling System', status: 'Active' },
    { name: 'Redux Toolkit', category: 'State Management', status: 'Active' },
    { name: 'React Router v7', category: 'Client Navigation', status: 'Active' },
    { name: 'Axios Service', category: 'HTTP Client Layer', status: 'Active' },
    { name: 'Socket.IO Client', category: 'WebSocket Layer', status: 'Configured' },
    { name: 'Express 5 & Node.js', category: 'Backend Server', status: 'Operational' },
    { name: 'MongoDB & Mongoose', category: 'Data Store', status: 'Configured' },
  ];

  const upcomingModules = [
    { title: 'Authentication & RBAC', desc: 'JWT + Cookie sessions, bcrypt hashing, role policies', tag: 'Next Phase' },
    { title: 'Workspaces & Projects', desc: 'Multi-tenant team boundaries, membership, access controls', tag: 'Planned' },
    { title: 'Kanban & Task Management', desc: 'Real-time drag-and-drop boards, assignment, deadlines', tag: 'Planned' },
    { title: 'Real-Time Chat & Collab', desc: 'Socket rooms, channel messaging, typing indicators, presence', tag: 'Planned' },
    { title: 'AI Assistant', desc: 'Intelligent project summarization, task breakdown, chat assistant', tag: 'Planned' },
    { title: 'Docker & Cloud Deployment', desc: 'Production containers, reverse proxy, CI/CD pipeline', tag: 'Planned' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            Project Foundation Initialized
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            {APP_NAME}
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            {APP_DESCRIPTION}. Built on a scalable, modular architecture separating client, server, and real-time communication protocols.
          </p>
        </div>
      </section>

      {/* System Diagnostics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Health Check Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Backend Health Status</h3>
                <p className="text-xs text-slate-400">Endpoint: <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">GET /api/health</code></p>
              </div>
              <StatusBadge
                status={healthStatus === 'succeeded' ? 'succeeded' : healthStatus === 'loading' ? 'loading' : healthStatus === 'failed' ? 'failed' : 'idle'}
                label={healthStatus === 'succeeded' ? 'Operational' : healthStatus === 'loading' ? 'Checking...' : healthStatus === 'failed' ? 'Failed' : 'Idle'}
              />
            </div>

            <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto min-h-[120px] flex items-center">
              {healthStatus === 'loading' && <span className="text-amber-400">Pinging backend /api/health...</span>}
              {healthStatus === 'succeeded' && healthData && (
                <pre className="text-emerald-300 w-full">{JSON.stringify(healthData, null, 2)}</pre>
              )}
              {healthStatus === 'failed' && (
                <div className="text-rose-400">
                  <p className="font-semibold">Connection Error:</p>
                  <p>{error || 'Ensure backend server is running on configured port.'}</p>
                </div>
              )}
              {healthStatus === 'idle' && <span className="text-slate-500">No health data retrieved yet.</span>}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Dispatched via Redux Toolkit async thunk</span>
            <button
              onClick={handleRefreshHealth}
              disabled={healthStatus === 'loading'}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
            >
              {healthStatus === 'loading' ? 'Checking...' : 'Retest Health'}
            </button>
          </div>
        </div>

        {/* Real-time Socket Connection Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Socket.IO Gateway</h3>
                <p className="text-xs text-slate-400">Transport: <span className="text-indigo-300">WebSocket / Polling fallback</span></p>
              </div>
              <StatusBadge
                status={isConnected ? 'connected' : 'disconnected'}
                label={isConnected ? 'Connected' : 'Disconnected'}
              />
            </div>

            <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                <span className="text-slate-500 font-mono">Client ID:</span>{' '}
                <span className="font-mono text-indigo-300">{isConnected ? 'Active Client Session' : 'None'}</span>
              </p>
              <p>
                <span className="text-slate-500 font-mono">Channel Status:</span>{' '}
                <span>{isConnected ? 'Bi-directional socket ready for live rooms' : 'Socket client standby (manual toggle available)'}</span>
              </p>
              <p className="text-slate-500 text-[11px] pt-1">
                CollabFlow uses dedicated WebSocket rooms for project boards, team channels, and live cursor presence.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Hook: <code className="text-slate-300">useSocket()</code></span>
            <div className="space-x-2">
              {isConnected ? (
                <button
                  onClick={disconnect}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 transition"
                >
                  Disconnect Socket
                </button>
              ) : (
                <button
                  onClick={connect}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  Connect Socket
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Diagnostics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Active Foundation Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stackItems.map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 hover:border-slate-700 transition space-y-1"
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{item.category}</span>
              <p className="text-sm font-semibold text-slate-200">{item.name}</p>
              <span className="inline-block text-[11px] text-emerald-400 font-medium">✓ {item.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Architectural Roadmap */}
      <section id="architecture" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Incremental Implementation Roadmap</h2>
          <span className="text-xs text-slate-500">Planned for subsequent phases</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingModules.map((mod) => (
            <div
              key={mod.title}
              className="p-5 rounded-xl border border-slate-800/60 bg-slate-900/20 hover:border-slate-800 transition flex flex-col justify-between"
            >
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200">{mod.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {mod.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{mod.desc}</p>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500/40 w-1/4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
