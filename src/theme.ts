import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo 500
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4', // Cyan 500
      light: '#22d3ee',
      dark: '#0891b2',
      contrastText: '#0f172a',
    },
    background: {
      default: '#0b0f19', // Premium deep space background
      paper: '#111827', // Gray 900
    },
    text: {
      primary: '#f3f4f6', // Gray 100
      secondary: '#9ca3af', // Gray 400
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'secondary' },
          style: {
            '&:hover': {
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
            },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default responsiveFontSizes(darkTheme);
