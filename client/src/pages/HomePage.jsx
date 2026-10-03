import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSystemHealth } from '../store/slices/systemSlice';
import useSocket from '../hooks/useSocket';
import AppIcon from '../components/common/AppIcon';
import { APP_NAME, APP_DESCRIPTION } from '../utils/constants';

const features = [
  {
    icon: 'users',
    title: 'Work together, clearly',
    description: 'Bring people into shared workspaces with access shaped around their role.',
    tone: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: 'briefcase',
    title: 'Keep projects moving',
    description: 'Organize project tasks, ownership, due dates, and priorities in one place.',
    tone: 'bg-violet-50 text-violet-700',
  },
  {
    icon: 'grid',
    title: 'See the work at a glance',
    description: 'Use a Kanban workflow to understand what is next, underway, and complete.',
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    icon: 'inbox',
    title: 'Stay in the loop',
    description: 'Get real-time updates and notifications as your team makes progress.',
    tone: 'bg-emerald-50 text-emerald-700',
  },
];

const previewColumns = [
  { title: 'To do', count: 2, dot: 'bg-slate-400', tasks: ['Outline launch plan', 'Review open questions'] },
  { title: 'In progress', count: 2, dot: 'bg-indigo-400', tasks: ['Design project page', 'Update team brief'] },
  { title: 'Done', count: 1, dot: 'bg-emerald-400', tasks: ['Create workspace'] },
];

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

  return (
    <div className="space-y-14 pb-8 sm:space-y-20">
      <section aria-labelledby="home-hero-title" className="relative isolate overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1120] px-6 py-8 shadow-xl shadow-slate-900/10 sm:px-10 sm:py-12 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:px-12 lg:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-40 h-112 w-md rounded-full bg-indigo-500/20 blur-[110px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[100px]" />

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
            A clearer way to work together
          </div>
          <h1 id="home-hero-title" className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
            Plan. Collaborate. <span className="text-indigo-300">Deliver.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
            One workspace for your team&apos;s projects, tasks, and collaboration. Keep priorities clear and progress moving, together.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:from-indigo-400 hover:to-indigo-500 hover:shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1120] active:translate-y-0">
              Get Started <span aria-hidden="true">→</span>
            </Link>
            <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 bg-white/5 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1120]">
              Sign In
            </Link>
          </div>
          <p className="mt-5 text-xs text-slate-400">Projects, task ownership, and team updates—connected in one place.</p>
        </div>

        <div className="relative z-10 mx-auto mt-10 w-full max-w-2xl lg:mt-0" role="group" aria-label={`${APP_NAME} project board preview`}>
          <div aria-hidden="true" className="absolute -inset-4 rounded-3xl bg-indigo-500/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/40 ring-1 ring-white/5">
            <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-slate-600" /><span className="h-2 w-2 rounded-full bg-slate-600" /><span className="h-2 w-2 rounded-full bg-slate-600" />
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-400">{APP_NAME.toUpperCase()} · PRODUCT BOARD</span>
              <div className="relative rounded-md p-1.5 text-slate-400">
                <AppIcon name="inbox" className="h-4 w-4" />
                <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-slate-900" />
                <span className="sr-only">One unread notification</span>
              </div>
            </div>
            <div className="flex min-h-68 sm:min-h-76">
              <aside className="hidden w-36 shrink-0 border-r border-white/10 bg-slate-950/40 p-3 sm:block">
                <div className="mb-5 flex items-center gap-2 px-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500 text-[9px] font-bold text-white">N</span>
                  <span className="truncate text-[10px] font-semibold text-slate-200">Northstar team</span>
                </div>
                <p className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-2 rounded-md bg-indigo-500/15 px-2 py-2 font-medium text-indigo-200"><AppIcon name="grid" className="h-3.5 w-3.5" /> Projects</div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-2 text-slate-400"><AppIcon name="check" className="h-3.5 w-3.5" /> My tasks</div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-2 text-slate-400"><AppIcon name="users" className="h-3.5 w-3.5" /> Members</div>
                </div>
                <div className="mt-6 border-t border-white/10 pt-3">
                  <p className="px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Your project</p>
                  <div className="mt-2 flex items-center gap-2 px-1 text-[10px] text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Website refresh</div>
                </div>
              </aside>

              <div className="min-w-0 flex-1 p-3 sm:p-4">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-500">Northstar team <span className="px-1">/</span> Projects</p>
                    <h2 className="mt-1 truncate text-sm font-semibold text-white sm:text-base">Website refresh</h2>
                  </div>
                  <div className="flex shrink-0 -space-x-1.5" aria-label="Three project members">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-indigo-300 text-[8px] font-bold text-indigo-950">AM</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-300 text-[8px] font-bold text-violet-950">JL</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-300 text-[8px] font-bold text-emerald-950">SK</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {previewColumns.map((column) => (
                    <div key={column.title} className="min-w-0 rounded-lg bg-slate-800/55 p-2 sm:p-2.5">
                      <div className="mb-2 flex items-center justify-between gap-1">
                        <span className="flex min-w-0 items-center gap-1.5 truncate text-[9px] font-semibold text-slate-300 sm:text-[10px]"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${column.dot}`} />{column.title}</span>
                        <span className="text-[9px] text-slate-500">{column.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {column.tasks.map((task, index) => (
                          <div key={task} className="rounded-md border border-white/6 bg-slate-900/90 p-2">
                            <p className="line-clamp-2 min-h-7 text-[9px] leading-3.5 text-slate-200 sm:text-[10px]">{task}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`rounded px-1.5 py-0.5 text-[8px] ${index === 0 ? 'bg-indigo-400/10 text-indigo-300' : 'bg-slate-700/70 text-slate-400'}`}>{index === 0 ? 'High' : 'Normal'}</span>
                              <span className="h-4 w-4 rounded-full bg-slate-700 text-center text-[8px] leading-4 text-slate-300">{['A', 'J', 'S'][index % 3]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[9px] text-slate-500">
                  <span>Team progress, at a glance</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 1 task complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title" className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Made for shared progress</p>
          <h2 id="features-title" className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Everything your team needs to move work forward</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Keep the people, plans, and day-to-day work connected without adding unnecessary process.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.tone}`}><AppIcon name={feature.icon} className="h-5 w-5" /></span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-cta-title" className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111a2d] px-6 py-8 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <h2 id="home-cta-title" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Bring your team&apos;s work into focus.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Start with a workspace, then make progress visible to everyone involved.</p>
        </div>
        <Link to="/register" className="relative mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111a2d] sm:mt-0 sm:w-auto">Get Started</Link>
      </section>

      <section aria-labelledby="platform-status-title" className="grid gap-4 border-t border-slate-200 pt-8 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="platform-status-title" className="text-sm font-semibold text-slate-900">Platform status</h2>
              <p className="mt-1 text-xs text-slate-500">Service availability</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${healthStatus === 'succeeded' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : healthStatus === 'loading' ? 'border-amber-200 bg-amber-50 text-amber-800' : healthStatus === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${healthStatus === 'succeeded' ? 'bg-emerald-500' : healthStatus === 'loading' ? 'bg-amber-500' : healthStatus === 'failed' ? 'bg-rose-500' : 'bg-slate-400'}`} />
              {healthStatus === 'succeeded' ? 'Operational' : healthStatus === 'loading' ? 'Checking' : healthStatus === 'failed' ? 'Unavailable' : 'Waiting'}
            </span>
          </div>
          <div className="mt-4 min-h-12 text-sm leading-6 text-slate-600">
            {healthStatus === 'loading' && <p>Checking service availability…</p>}
            {healthStatus === 'failed' && <p role="status" className="text-rose-700">{error || 'The service could not be reached. Please try again.'}</p>}
            {healthStatus === 'succeeded' && healthData && (
              <details className="text-xs">
                <summary className="w-fit cursor-pointer font-medium text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">View service details</summary>
                <pre className="mt-2 max-h-28 overflow-auto rounded-md bg-slate-50 p-3 text-[11px] leading-4 text-slate-600">{JSON.stringify(healthData, null, 2)}</pre>
              </details>
            )}
            {healthStatus === 'idle' && <p>Service status has not been checked yet.</p>}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <code className="text-[11px] text-slate-500">GET /api/health</code>
            <button type="button" onClick={handleRefreshHealth} disabled={healthStatus === 'loading'} className="rounded-md px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
              {healthStatus === 'loading' ? 'Checking…' : 'Check again'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Live connection</h2>
              <p className="mt-1 text-xs text-slate-500">Real-time collaboration channel</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">
            {isConnected ? 'The real-time connection is active.' : 'Connect to check the real-time channel.'}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="text-[11px] text-slate-500">Socket.IO</span>
            {isConnected ? (
              <button type="button" onClick={disconnect} className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Disconnect</button>
            ) : (
              <button type="button" onClick={connect} className="rounded-md px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Connect</button>
            )}
          </div>
        </div>
      </section>
      <p className="-mt-10 text-center text-xs text-slate-500">{APP_DESCRIPTION}</p>
    </div>
  );
}
