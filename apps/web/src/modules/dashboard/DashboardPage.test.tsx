import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';
import { appTheme } from '../../app/theme';
import { DashboardPage } from './DashboardPage';

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    hasPermission: () => true,
    isDepartmentScoped: false,
    isCitizen: false,
    profile: { isSuperAdmin: false, departmentIds: [], districtIds: ['11111111-1111-1111-1111-111111111111'] },
  }),
}));

vi.mock('../../components/DistrictMap', () => ({
  DistrictMap: () => <div>Map of Changlang</div>,
}));

vi.mock('../../services/api/dashboard', () => ({
  dashboardApi: {
    summary: async () => ({
      totals: { projects: 2 },
      latestProgress: { delayed: 1, stalled: 0, inProgress: 1, completed: 0, notStarted: 0 },
      byDepartment: [],
    }),
    overview: async () => ({
      totals: {
        schemes: 3,
        projects: 2,
        ongoing: 2,
        completed: 0,
        delayed: 1,
        onTrack: 1,
        beneficiaries: 21500,
        financialProgress: 68,
        physicalProgress: 74,
        financialStatus: 'ATTENTION',
        physicalStatus: 'ATTENTION',
        dcIntervention: 1,
      },
      departments: [],
      schemes: [{ id: 's1', name: 'JJM', departmentId: 'd1', target: 25000, achievement: 21500, progress: 86, physicalPercent: 86, financialPercent: 72, status: 'ATTENTION', lastUpdated: '2026-09' }],
      delayedSchemes: [{ id: 's1', name: 'JJM', progress: 86, status: 'ATTENTION' }],
      laggingBlocks: [],
      lastUpdated: '2026-09',
    }),
    delayed: async () => [
      {
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        code: 'CHANGLANG-PWD-2026-00001',
        name: 'Road',
        districtId: '11111111-1111-1111-1111-111111111111',
        departmentId: '33333333-3333-3333-3333-333333333333',
        locationText: 'XYZ',
        status: 'DELAYED',
        periodYm: '2026-08',
        version: 1,
        daysPending: 42,
      },
    ],
    mapPoints: async () => [],
    governance: async () => ({ openActions: 1, doneActions: 0, meetings: 1, immediate: 2, attention: 1 }),
  },
}));

vi.mock('../../services/api/admin', () => ({
  adminApi: {
    districts: async () => [{ id: '11111111-1111-1111-1111-111111111111', name: 'Changlang', population: 148226 }],
    departments: async () => [],
    locations: async () => [],
  },
}));

describe('DashboardPage', () => {
  it('shows KPIs from backend aggregates', async () => {
    const client = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <ThemeProvider theme={appTheme}>
            <DashboardPage />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('DC INTERVENTION REQUIRED')).toBeInTheDocument();
    expect(await screen.findByText(/42 days pending/)).toBeInTheDocument();
    expect(await screen.findByText('DEPARTMENT PERFORMANCE')).toBeInTheDocument();
  });
});
