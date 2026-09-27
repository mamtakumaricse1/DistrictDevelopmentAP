import { createTheme } from '@mui/material/styles';

export const govColors = {
  navy: '#0B2C4A',
  navyDark: '#071E33',
  saffron: '#C56A12',
  saffronBright: '#FF9933',
  green: '#138808',
  gold: '#C4A35A',
  ivory: '#F4F0E6',
  line: '#E6DCC8',
};

export const appTheme = createTheme({
  palette: {
    primary: {
      main: govColors.navy,
      dark: govColors.navyDark,
      light: '#1A4A73',
      contrastText: '#ffffff',
    },
    secondary: {
      main: govColors.saffron,
      contrastText: '#ffffff',
    },
    background: {
      default: govColors.ivory,
      paper: '#ffffff',
    },
    success: { main: '#1B7A4E' },
    warning: { main: '#B45309' },
    error: { main: '#B42318' },
    info: { main: '#155E75' },
    divider: govColors.line,
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif',
      fontSize: '1.85rem',
      fontWeight: 650,
      letterSpacing: '-0.015em',
    },
    h2: {
      fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif',
      fontSize: '1.45rem',
      fontWeight: 650,
    },
    h3: {
      fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif',
      fontSize: '1.15rem',
      fontWeight: 650,
    },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${govColors.line}`,
          boxShadow: '0 10px 28px rgba(7, 30, 51, 0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: govColors.navy,
          color: '#ffffff',
          fontWeight: 650,
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
          borderBottom: 0,
        },
        body: {
          borderColor: govColors.line,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: govColors.ivory,
        },
      },
    },
  },
});
