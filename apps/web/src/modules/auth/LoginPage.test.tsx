import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { appTheme } from '../../app/theme';
import { LoginPage } from './LoginPage';

const loginWithPassword = vi.fn();

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    loginWithPassword,
    error: null,
    status: 'anonymous',
  }),
}));

describe('LoginPage', () => {
  it('asks for a username and password without naming a district', async () => {
    loginWithPassword.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <ThemeProvider theme={appTheme}>
          <LoginPage />
        </ThemeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'District Development Dashboard' })).toBeInTheDocument();
    expect(screen.queryByText(/changlang/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'officer' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(loginWithPassword).toHaveBeenCalledWith('officer', 'secret'));
  });
});
