import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';
import { appTheme } from '../../app/theme';
import { LoginPage } from './LoginPage';

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    login: vi.fn(),
    error: null,
  }),
}));

vi.mock('../../services/api/auth', () => ({
  fetchLoginOptions: async () => [
    {
      kind: 'district',
      label: 'Changlang',
      code: 'CHANGLANG',
      issuer: 'http://localhost:8080/realms/changlang',
      realm: 'changlang',
      clientId: 'ddwmd-web',
      districtId: '1',
    },
  ],
}));

describe('LoginPage', () => {
  it('lists district realms from the API', async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <ThemeProvider theme={appTheme}>
          <LoginPage />
        </ThemeProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Changlang')).toBeInTheDocument();
    expect(screen.getByText('Realm changlang')).toBeInTheDocument();
  });
});
