import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { fetchWorkspaces } from '../features/workspaces/workspaceSlice';

export default function RootLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const appMode = /^\/(dashboard|workspaces|superadmin)(\/|$)/.test(location.pathname);
  const isWorkspaceListPage = location.pathname === '/workspaces';

  useEffect(() => {
    if (isAuthenticated && !isWorkspaceListPage) dispatch(fetchWorkspaces());
  }, [dispatch, isAuthenticated, isWorkspaceListPage]);

  if (appMode) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Navbar appMode onOpenSidebar={() => setMobileSidebarOpen(true)} />
          <main className="min-w-0 flex-1 bg-slate-50">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
