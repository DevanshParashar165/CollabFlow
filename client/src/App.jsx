import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacesListPage from './pages/WorkspacesListPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import SuperAdminPage from './pages/SuperAdminPage';
import NotFoundPage from './pages/NotFoundPage';
import ProjectsListPage from './pages/ProjectsListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskDetailPage from './features/tasks/pages/TaskDetailPage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import PublicOnlyRoute from './features/auth/components/PublicOnlyRoute';
import SuperAdminRoute from './features/auth/components/SuperAdminRoute';
import { checkAuthStatus } from './features/auth/authSlice';
import { disconnectSocket } from './socket/socket';

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // On application startup: hydrate auth state via HTTP-only cookie
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) disconnectSocket();
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Workspace routes */}
        <Route
          path="workspaces"
          element={
            <ProtectedRoute>
              <WorkspacesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="workspaces/:workspaceId"
          element={
            <ProtectedRoute>
              <WorkspaceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="workspaces/:workspaceId/projects" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
        <Route path="workspaces/:workspaceId/projects/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
  <Route path="workspaces/:workspaceId/projects/:projectId/tasks/:taskId" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />

        {/* Superadmin routes */}
        <Route
          path="superadmin"
          element={
            <SuperAdminRoute>
              <SuperAdminPage />
            </SuperAdminRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
