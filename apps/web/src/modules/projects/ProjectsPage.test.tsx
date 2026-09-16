import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { appTheme } from '../../app/theme';
import { ProjectsPage } from './ProjectsPage';

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) =>
      ['project:read', 'project:create', 'project:update', 'project:delete'].includes(permission),
    profile: {
      isSuperAdmin: false,
      districtIds: ['11111111-1111-1111-1111-111111111111'],
      issuer: 'http://localhost:8080/realms/changlang',
    },
  }),
}));

vi.mock('../../services/api/admin', () => ({
  adminApi: {
    districts: async () => [
      {
        id: '11111111-1111-1111-1111-111111111111',
        code: 'CHANGLANG',
        name: 'Changlang',
        stateCode: 'AR',
        stateName: 'Arunachal Pradesh',
        headquarters: 'Changlang',
        timezone: 'Asia/Kolkata',
        isActive: true,
        keycloakRealm: 'changlang',
        keycloakIssuer: 'http://localhost:8080/realms/changlang',
      },
    ],
    departments: async () => [
      {
        id: '33333333-3333-3333-3333-333333333333',
        districtId: '11111111-1111-1111-1111-111111111111',
        code: 'PWD',
        name: 'Public Works',
        shortName: 'PWD',
        isActive: true,
      },
    ],
    agencies: async () => [],
  },
}));

vi.mock('../../services/api/projects', () => ({
  projectsApi: {
    list: async () => ({
      data: [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
          code: 'CHANGLANG-PWD-2026-00001',
          name: 'Changlang PWD road strengthening',
          description: null,
          districtId: '11111111-1111-1111-1111-111111111111',
          departmentId: '33333333-3333-3333-3333-333333333333',
          implementingAgencyId: null,
          executingAgencyId: null,
          financialYear: 2026,
          sanctionedAmount: '10.00',
          status: 'ACTIVE',
          startDate: null,
          endDate: null,
          locationText: 'Changlang HQ approach',
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
  },
}));

describe('ProjectsPage', () => {
  it('lists projects and offers create for district administrators', async () => {
    const client = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <ThemeProvider theme={appTheme}>
            <ProjectsPage />
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('CHANGLANG-PWD-2026-00001')).toBeInTheDocument();
    expect(screen.getByText('Changlang PWD road strengthening')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add project' })).toBeInTheDocument();
  });
});
