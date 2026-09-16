import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { appTheme } from '../app/theme';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  it('renders a human-readable delayed status', () => {
    render(
      <ThemeProvider theme={appTheme}>
        <StatusChip status="DELAYED" />
      </ThemeProvider>,
    );
    expect(screen.getByText('DELAYED')).toBeInTheDocument();
  });
});
