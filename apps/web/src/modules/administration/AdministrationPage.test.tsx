import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';
import { appTheme } from '../../app/theme';
import { AdministrationPage } from './AdministrationPage';

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) =>
      ['district:read', 'district:manage', 'user:manage', 'master:manage', 'department:manage', 'agency:manage'].includes(
        permission,
      ),
    profile: {
      isSuperAdmin: true,
      districtIds: [],
      issuer: 'http://localhost:8080/realms/system',
    },
  }),
}));

vi.mock('../../services/api/admin', () => ({
  adminApi: {
    districts: async () => [
      {
        id: '1',
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
    departments: async () => [],
    agencies: async () => [],
    users: async () => [],
    roles: async () => [],
    categories: async () => [],
    items: async () => [],
    settings: async () => [],
  },
}));

describe('AdministrationPage', () => {
  it('shows administration tabs and seeded district data', async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <ThemeProvider theme={appTheme}>
          <AdministrationPage />
        </ThemeProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Districts')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(await screen.findByText('Changlang')).toBeInTheDocument();
    expect(await screen.findByText('changlang')).toBeInTheDocument();
  });
});
