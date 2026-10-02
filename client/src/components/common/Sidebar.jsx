import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import { toggleNotificationPanel } from "../../features/notifications/notificationSlice";
import { setSelectedWorkspaceId } from "../../features/workspaces/workspaceSlice";
import { APP_NAME } from "../../utils/constants";
import AppIcon from "./AppIcon";

const getWorkspaceId = (pathname) =>
  pathname.match(/^\/workspaces\/([^/]+)/)?.[1] || null;

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onClose,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { workspaces, currentWorkspace, selectedWorkspaceId } = useSelector(
    (state) => state.workspaces,
  );
  const { isOpen: notificationsOpen } = useSelector(
    (state) => state.notifications,
  );
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const routeWorkspaceId = getWorkspaceId(location.pathname);
  const activeWorkspaceId =
    routeWorkspaceId || currentWorkspace?._id || selectedWorkspaceId;
  const selectedWorkspace =
    workspaces.find((workspace) => workspace._id === activeWorkspaceId) ||
    (currentWorkspace?._id === activeWorkspaceId ? currentWorkspace : null);
  const isSuperAdmin = user?.platformRole === "SUPERADMIN";
  const compact = collapsed && !mobileOpen;

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);
  const closeAfterNavigation = () => {
    setWorkspaceMenuOpen(false);
    onClose?.();
  };
  const projectsPath = activeWorkspaceId
    ? `/workspaces/${activeWorkspaceId}/projects`
    : "/workspaces";
  const membersPath = activeWorkspaceId
    ? `/workspaces/${activeWorkspaceId}`
    : "/workspaces";

  const navLink = (to, label, icon, active = isActive(to)) => (
    <Link
      key={label}
      to={to}
      onClick={closeAfterNavigation}
      title={compact ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      } ${compact ? "justify-center px-0" : ""}`}
    >
      <AppIcon name={icon} className="h-4.5 w-4.5 shrink-0" />
      <span className={compact ? "sr-only" : "truncate"}>{label}</span>
    </Link>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 md:hidden"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          collapsed ? "md:w-19" : "md:w-64"
        } ${mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:shadow-none"}`}
      >
        <div
          className={`flex h-17 shrink-0 items-center border-b border-slate-100 px-4 ${compact ? "md:justify-center md:px-2" : "justify-between"}`}
        >
          <Link
            to="/dashboard"
            onClick={closeAfterNavigation}
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold tracking-wide text-white">
              CF
            </span>
            <span
              className={`truncate text-[15px] font-semibold tracking-tight text-slate-900 ${compact ? "md:hidden" : ""}`}
            >
              {APP_NAME}
            </span>
          </Link>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:flex ${compact ? "md:hidden" : ""}`}
          >
            <AppIcon name="collapse" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>
          {compact && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:flex"
            >
              <AppIcon name="expand" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative px-3 pt-4">
          <button
            type="button"
            aria-expanded={workspaceMenuOpen}
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
            className={`flex min-h-11 w-full items-center gap-2.5 rounded-md border border-slate-200 px-2.5 text-left transition-colors hover:bg-slate-50 ${compact ? "md:justify-center md:border-transparent md:px-0" : ""}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-indigo-100 text-xs font-semibold text-indigo-700">
              {selectedWorkspace?.name?.[0]?.toUpperCase() || "W"}
            </span>
            <span className={`min-w-0 flex-1 ${compact ? "md:hidden" : ""}`}>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Workspace
              </span>
              <span className="block truncate text-xs font-semibold text-slate-800">
                {selectedWorkspace?.name || "Choose workspace"}
              </span>
            </span>
            <AppIcon
              name="chevronDown"
              className={`h-4 w-4 shrink-0 text-slate-400 ${compact ? "md:hidden" : ""}`}
            />
          </button>
          {workspaceMenuOpen && (
            <div
              className={`absolute left-3 right-3 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg ${compact ? "md:left-full md:right-auto md:ml-2 md:w-56" : ""}`}
            >
              {workspaces.length ? (
                workspaces.map((workspace) => (
                  <button
                    key={workspace._id}
                    type="button"
                    onClick={() => {
                      dispatch(setSelectedWorkspaceId(workspace._id));
                      navigate(`/workspaces/${workspace._id}`);
                      closeAfterNavigation();
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-slate-50 ${workspace._id === routeWorkspaceId ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-600">
                      {workspace.name?.[0]?.toUpperCase() || "W"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {workspace.name}
                    </span>
                    {workspace.role && (
                      <span className="text-[10px] uppercase text-slate-400">
                        {workspace.role}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <Link
                  to="/workspaces"
                  onClick={closeAfterNavigation}
                  className="block rounded-md px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Browse workspaces
                </Link>
              )}
            </div>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-6">
          <p
            className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 ${compact ? "md:sr-only" : ""}`}
          >
            Workspace
          </p>
          <div className="space-y-1">
            {navLink("/dashboard", "Overview", "grid")}
            <button
              type="button"
              disabled
              title={compact ? "My Tasks is not available yet" : undefined}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-400 opacity-70 ${compact ? "justify-center px-0" : ""}`}
            >
              <AppIcon name="check" className="h-4.5 w-4.5 shrink-0" />
              <span className={compact ? "sr-only" : ""}>My Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch(toggleNotificationPanel());
                closeAfterNavigation();
              }}
              title={compact ? "Inbox" : undefined}
              aria-pressed={notificationsOpen}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors ${
                notificationsOpen
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } ${compact ? "justify-center px-0" : ""}`}
            >
              <AppIcon name="inbox" className="h-4.5 w-4.5 shrink-0" />
              <span className={compact ? "sr-only" : ""}>Inbox</span>
            </button>
            {navLink(
              projectsPath,
              "Projects",
              "folder",
              location.pathname.includes("/projects"),
            )}
            {navLink(
              membersPath,
              "Members",
              "users",
              Boolean(activeWorkspaceId) &&
                location.pathname === `/workspaces/${activeWorkspaceId}`,
            )}
            <button
              type="button"
              disabled
              title={compact ? "Settings is not available yet" : undefined}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-400 opacity-70 ${compact ? "justify-center px-0" : ""}`}
            >
              <AppIcon name="settings" className="h-4.5 w-4.5 shrink-0" />
              <span className={compact ? "sr-only" : ""}>Settings</span>
            </button>
            {isSuperAdmin && navLink("/superadmin", "Super Admin", "briefcase")}
          </div>

          <div className="my-5 border-t border-slate-100" />
          <div
            className={`mb-2 flex items-center px-3 ${compact ? "md:justify-center md:px-0" : "justify-between"}`}
          >
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 ${compact ? "md:sr-only" : ""}`}
            >
              Favorites
            </p>
            <AppIcon
              name="star"
              className={`h-3.5 w-3.5 text-slate-300 ${compact ? "md:hidden" : ""}`}
            />
          </div>
          <p
            className={`px-3 py-1 text-xs text-slate-400 ${compact ? "md:sr-only" : ""}`}
          >
            Favorites aren&apos;t available yet.
          </p>
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <div
            className={`flex items-center gap-2.5 rounded-md px-2 py-2 ${compact ? "md:justify-center md:px-0" : ""}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
            <span className={`min-w-0 flex-1 ${compact ? "md:hidden" : ""}`}>
              <span className="block truncate text-xs font-semibold text-slate-800">
                {user?.name || "CollabFlow user"}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {user?.platformRole || "Member"}
              </span>
            </span>
            {isAuthenticated && !compact && (
              <button
                type="button"
                onClick={() => dispatch(logoutUser())}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <AppIcon name="logout" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
