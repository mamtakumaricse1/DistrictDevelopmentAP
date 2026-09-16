import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { AppShell } from '../layouts/AppShell';
import { ActionsPage } from '../modules/actions/ActionsPage';
import { AdministrationPage } from '../modules/administration/AdministrationPage';
import { AuthCallbackPage } from '../modules/auth/AuthCallbackPage';
import { LoginPage } from '../modules/auth/LoginPage';
import { SilentRenewPage } from '../modules/auth/SilentRenewPage';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { HealthPage } from '../modules/health/HealthPage';
import { MeetingsPage } from '../modules/meetings/MeetingsPage';
import { ProjectDetailPage } from '../modules/projects/ProjectDetailPage';
import { ProjectsPage } from '../modules/projects/ProjectsPage';
import { ReportsPage } from '../modules/reports/ReportsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/auth/silent-renew', element: <SilentRenewPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'actions', element: <ActionsPage /> },
      { path: 'meetings', element: <MeetingsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'administration', element: <AdministrationPage /> },
      { path: 'health', element: <HealthPage /> },
    ],
  },
]);
