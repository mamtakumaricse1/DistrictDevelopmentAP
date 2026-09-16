import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';
import { appTheme } from '../../app/theme';
import { DashboardPage } from './DashboardPage';

vi.mock('../../services/api/dashboard', () => ({
  dashboardApi: {
    summary: async () => ({
      totals: { projects: 2 },
      latestProgress: { delayed: 1, stalled: 0, inProgress: 1, completed: 0, notStarted: 0 },
      byDepartment: [],
    }),
    delayed: async () => [
      {
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        code: 'CHANGLANG-PWD-2026-00001',
        name: 'Road',
        districtId: '11111111-1111-1111-1111-111111111111',
        departmentId: '33333333-3333-3333-3333-333333333333',
        status: 'DELAYED',
        periodYm: '2026-08',
        version: 1,
      },
    ],
    governance: async () => ({ openActions: 1, doneActions: 0, meetings: 1 }),
  },
}));

vi.mock('../../services/api/admin', () => ({
  adminApi: {
    districts: async () => [{ id: '11111111-1111-1111-1111-111111111111', name: 'Changlang' }],
    departments: async () => [],
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
    expect(await screen.findByText('Delayed and stalled works')).toBeInTheDocument();
    expect(await screen.findByText('CHANGLANG-PWD-2026-00001')).toBeInTheDocument();
  });
});
