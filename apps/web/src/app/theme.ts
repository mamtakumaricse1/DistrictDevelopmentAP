import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#0B3D4A',
      dark: '#072C36',
      light: '#1A5A6B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8B4513',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F3F5F7',
      paper: '#ffffff',
    },
    success: { main: '#1B7A4E' },
    warning: { main: '#B45309' },
    error: { main: '#B42318' },
    info: { main: '#155E75' },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 650 },
    h2: { fontSize: '1.35rem', fontWeight: 650 },
    h3: { fontSize: '1.15rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F3F5F7',
        },
      },
    },
  },
});
