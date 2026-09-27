import { Navigate, createBrowserRouter } from 'react-router-dom';
import { OfficerOnly, RequireAuth } from '../auth/RequireAuth';
import { AppShell } from '../layouts/AppShell';
import { ActionsPage } from '../modules/actions/ActionsPage';
import { AdministrationPage } from '../modules/administration/AdministrationPage';
import { AuthCallbackPage } from '../modules/auth/AuthCallbackPage';
import { LoginPage } from '../modules/auth/LoginPage';
import { SilentRenewPage } from '../modules/auth/SilentRenewPage';
import { BlockDetailPage } from '../modules/blocks/BlockDetailPage';
import { BlocksPage } from '../modules/blocks/BlocksPage';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { DepartmentDashboardPage } from '../modules/dashboard/DepartmentDashboardPage';
import { ExceptionsPage } from '../modules/exceptions/ExceptionsPage';
import { HealthPage } from '../modules/health/HealthPage';
import { HumanDevelopmentPage } from '../modules/human-development/HumanDevelopmentPage';
import { InfrastructurePage } from '../modules/infrastructure/InfrastructurePage';
import { MeetingDetailPage } from '../modules/meetings/MeetingDetailPage';
import { MeetingsPage } from '../modules/meetings/MeetingsPage';
import { ProjectDetailPage } from '../modules/projects/ProjectDetailPage';
import { ProjectsPage } from '../modules/projects/ProjectsPage';
import { ReportsPage } from '../modules/reports/ReportsPage';
import { SchemeDetailPage } from '../modules/schemes/SchemeDetailPage';
import { SchemesPage } from '../modules/schemes/SchemesPage';

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
      { path: 'dashboard', element: <OfficerOnly><DashboardPage /></OfficerOnly> },
      { path: 'departments/:departmentId', element: <OfficerOnly><DepartmentDashboardPage /></OfficerOnly> },
      { path: 'schemes', element: <SchemesPage /> },
      { path: 'schemes/:id', element: <OfficerOnly><SchemeDetailPage /></OfficerOnly> },
      { path: 'blocks', element: <OfficerOnly><BlocksPage /></OfficerOnly> },
      { path: 'blocks/:locationId', element: <OfficerOnly><BlockDetailPage /></OfficerOnly> },
      { path: 'infrastructure', element: <OfficerOnly><InfrastructurePage /></OfficerOnly> },
      { path: 'human-development', element: <OfficerOnly><HumanDevelopmentPage /></OfficerOnly> },
      { path: 'exceptions', element: <OfficerOnly><ExceptionsPage /></OfficerOnly> },
      { path: 'projects', element: <OfficerOnly><ProjectsPage /></OfficerOnly> },
      { path: 'projects/:id', element: <OfficerOnly><ProjectDetailPage /></OfficerOnly> },
      { path: 'actions', element: <OfficerOnly><ActionsPage /></OfficerOnly> },
      { path: 'meetings', element: <OfficerOnly><MeetingsPage /></OfficerOnly> },
      { path: 'meetings/:id', element: <OfficerOnly><MeetingDetailPage /></OfficerOnly> },
      { path: 'reports', element: <OfficerOnly><ReportsPage /></OfficerOnly> },
      { path: 'administration', element: <OfficerOnly><AdministrationPage /></OfficerOnly> },
      { path: 'health', element: <OfficerOnly><HealthPage /></OfficerOnly> },
    ],
  },
]);
