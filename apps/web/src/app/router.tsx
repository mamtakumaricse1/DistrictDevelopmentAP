import { createBrowserRouter } from 'react-router-dom';
import { HomeRedirect, RequireAuth, RequirePermission } from '../auth/RequireAuth';
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
      { index: true, element: <HomeRedirect /> },
      { path: 'dashboard', element: <RequirePermission permission="dashboard:read" officerOnly><DashboardPage /></RequirePermission> },
      { path: 'departments/:departmentId', element: <RequirePermission permission="dashboard:read" officerOnly><DepartmentDashboardPage /></RequirePermission> },
      { path: 'schemes', element: <RequirePermission permission="project:read"><SchemesPage /></RequirePermission> },
      { path: 'schemes/:id', element: <RequirePermission permission="project:read" officerOnly><SchemeDetailPage /></RequirePermission> },
      { path: 'blocks', element: <RequirePermission permission="dashboard:read" officerOnly><BlocksPage /></RequirePermission> },
      { path: 'blocks/:locationId', element: <RequirePermission permission="dashboard:read" officerOnly><BlockDetailPage /></RequirePermission> },
      { path: 'infrastructure', element: <RequirePermission permission="dashboard:read" officerOnly><InfrastructurePage /></RequirePermission> },
      { path: 'human-development', element: <RequirePermission permission="dashboard:read" officerOnly><HumanDevelopmentPage /></RequirePermission> },
      { path: 'exceptions', element: <RequirePermission permission="dashboard:read" officerOnly><ExceptionsPage /></RequirePermission> },
      { path: 'projects', element: <RequirePermission permission="project:read" officerOnly><ProjectsPage /></RequirePermission> },
      { path: 'projects/:id', element: <RequirePermission permission="project:read" officerOnly><ProjectDetailPage /></RequirePermission> },
      { path: 'actions', element: <RequirePermission anyOf={['action:update', 'action:manage']} officerOnly><ActionsPage /></RequirePermission> },
      { path: 'meetings', element: <RequirePermission permission="meeting:manage" officerOnly><MeetingsPage /></RequirePermission> },
      { path: 'meetings/:id', element: <RequirePermission permission="meeting:manage" officerOnly><MeetingDetailPage /></RequirePermission> },
      { path: 'reports', element: <RequirePermission permission="report:export" officerOnly><ReportsPage /></RequirePermission> },
      { path: 'administration', element: <RequirePermission anyOf={['user:manage', 'master:manage', 'district:manage']} officerOnly><AdministrationPage /></RequirePermission> },
      { path: 'health', element: <RequirePermission permission="dashboard:read" officerOnly><HealthPage /></RequirePermission> },
      { path: '*', element: <HomeRedirect /> },
    ],
  },
]);
