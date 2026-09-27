import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import { APP_NAME } from '../../utils/constants';
import NotificationBell from './NotificationBell';
import AppIcon from './AppIcon';

const getBreadcrumbs = (pathname, workspaces, currentWorkspace, projectsByWorkspace, currentProject) => {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return [{ label: 'Home' }];
  if (segments[0] === 'dashboard') return [{ label: 'Overview', href: '/dashboard' }];
  if (segments[0] === 'superadmin') return [{ label: 'Super Admin', href: '/superadmin' }];
  if (segments[0] !== 'workspaces') {
    return [{ label: segments.at(-1).replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase()) }];
  }

  const crumbs = [{ label: 'Workspaces', href: '/workspaces' }];
  const workspaceId = segments[1];
  if (!workspaceId) return crumbs;

  const workspace = workspaces.find((item) => item._id === workspaceId)
    || (currentWorkspace?._id === workspaceId ? currentWorkspace : null);
  crumbs.push({ label: workspace?.name || 'Workspace', href: `/workspaces/${workspaceId}` });
  if (segments.length === 2) return crumbs;

  if (segments[2] === 'projects') {
    crumbs.push({ label: 'Projects', href: `/workspaces/${workspaceId}/projects` });
    if (segments[3]) {
      const project = (projectsByWorkspace[workspaceId] || []).find((item) => item._id === segments[3])
        || (currentProject?._id === segments[3] ? currentProject : null);
      crumbs.push({ label: project?.name || 'Project', href: `/workspaces/${workspaceId}/projects/${segments[3]}` });
    }
    if (segments[4] === 'tasks' && segments[5]) crumbs.push({ label: 'Task details' });
  }
  return crumbs;
};

export default function Navbar({ appMode = false, onOpenSidebar }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspaces);
  const { projectsByWorkspace, currentProject } = useSelector((state) => state.projects);
  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  const breadcrumbs = getBreadcrumbs(location.pathname, workspaces, currentWorkspace, projectsByWorkspace, currentProject);
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    const workspaceResults = workspaces
      .filter((workspace) => workspace.name?.toLowerCase().includes(query))
      .map((workspace) => ({ id: `workspace-${workspace._id}`, label: workspace.name, detail: 'Workspace', href: `/workspaces/${workspace._id}` }));
    const projectResults = Object.entries(projectsByWorkspace).flatMap(([workspaceId, projects]) =>
      (projects || [])
        .filter((project) => project.name?.toLowerCase().includes(query))
        .map((project) => ({ id: `project-${project._id}`, label: project.name, detail: 'Project', href: `/workspaces/${workspaceId}/projects/${project._id}` }))
    );
    return [...workspaceResults, ...projectResults].slice(0, 6);
  }, [projectsByWorkspace, search, workspaces]);

  useEffect(() => {
    const closeMenus = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearch('');
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logoutUser());
  };

  if (!appMode) {
    return (
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold tracking-wide text-white">CF</span>
            <span className="text-base font-semibold tracking-tight text-slate-900">{APP_NAME}</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            {isAuthenticated ? (
              <Link to="/dashboard" className="font-medium text-slate-600 hover:text-indigo-700">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
                <Link to="/register" className="rounded-md bg-indigo-600 px-3.5 py-2 font-medium text-white hover:bg-indigo-700">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 h-17 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <button type="button" onClick={onOpenSidebar} aria-label="Open navigation menu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden">
          <AppIcon name="menu" className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-2 text-sm sm:flex">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
                {index > 0 && <AppIcon name="chevronRight" className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                {crumb.href && !isLast ? <Link to={crumb.href} className="truncate text-slate-500 hover:text-slate-800">{crumb.label}</Link> : <span aria-current={isLast ? 'page' : undefined} className={`truncate ${isLast ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{crumb.label}</span>}
              </span>
            );
          })}
        </nav>

        <div ref={searchRef} className="relative ml-auto w-full max-w-90">
          <AppIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Escape') setSearch(''); }}
            aria-label="Search workspaces and projects"
            placeholder="Search workspaces & projects"
            autoComplete="off"
            className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
          {search.trim() && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {searchResults.length ? searchResults.map((result) => (
                <button type="button" key={result.id} onClick={() => { navigate(result.href); setSearch(''); }} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
                  <span className="truncate text-sm font-medium text-slate-800">{result.label}</span>
                  <span className="shrink-0 text-xs text-slate-400">{result.detail}</span>
                </button>
              )) : <p className="px-3 py-3 text-sm text-slate-500">No matching workspaces or projects.</p>}
            </div>
          )}
        </div>

        {isAuthenticated && (
          <>
            <div className="flex h-9 shrink-0 items-center border-l border-slate-200 pl-2"><NotificationBell /></div>
            <div ref={profileRef} className="relative shrink-0">
              <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Open profile menu" className="flex h-9 items-center gap-2 rounded-md px-1.5 text-left hover:bg-slate-100">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 lg:block">{user?.name || 'Account'}</span>
                <AppIcon name="chevronDown" className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                  <div className="border-b border-slate-100 px-2.5 py-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{user?.name || 'CollabFlow user'}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email || user?.platformRole}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="mt-1 block rounded-md px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50">Account overview</Link>
                  <button type="button" onClick={handleLogout} className="block w-full rounded-md px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">Sign out</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
