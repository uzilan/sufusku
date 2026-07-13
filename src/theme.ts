import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Board-specific color tokens, defined once per color scheme. Components read
// them through theme.vars (CSS variables), so switching modes is pure CSS.
export interface BoardPalette {
  line: string; // 3x3 box separator
  subline: string; // plain cell separator
  frame: string; // outer board border + scrollbar thumb
  shadow: string; // board drop shadow
  hoverBg: string; // cell hover tint
  conflictBg: string;
  conflictSelectedBg: string;
  conflictBorder: string;
  conflictText: string;
  singleBg: string; // single-remaining-candidate green
  selectionBg: string;
  relatedTint: string; // same row/col/box as selection
  shareTint: string; // shares value with selection
  padBorder: string; // NumberPad button border
}

declare module '@mui/material/styles' {
  interface Palette {
    board: BoardPalette;
  }
  interface PaletteOptions {
    board?: BoardPalette;
  }
}

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    dark: {
      palette: {
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
        board: {
          line: '#4b5563',
          subline: 'rgba(255, 255, 255, 0.3)',
          frame: '#1f2937',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          hoverBg: 'rgba(255, 255, 255, 0.03)',
          conflictBg: 'rgba(239, 68, 68, 0.2)',
          conflictSelectedBg: 'rgba(239, 68, 68, 0.25)',
          conflictBorder: 'rgba(239, 68, 68, 0.4)',
          conflictText: '#f87171',
          singleBg: 'rgba(34, 197, 94, 0.2)',
          selectionBg: 'rgba(99, 102, 241, 0.15)',
          relatedTint: 'rgba(99, 102, 241, 0.05)',
          shareTint: 'rgba(6, 182, 212, 0.2)',
          padBorder: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    light: {
      palette: {
        primary: {
          main: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#06b6d4',
          light: '#22d3ee',
          dark: '#0891b2',
          contrastText: '#0f172a',
        },
        background: {
          default: '#f8fafc', // Slate 50
          paper: '#ffffff',
        },
        text: {
          primary: '#0f172a', // Slate 900
          secondary: '#64748b', // Slate 500
        },
        divider: 'rgba(0, 0, 0, 0.08)',
        board: {
          line: '#94a3b8',
          subline: 'rgba(0, 0, 0, 0.3)',
          frame: '#cbd5e1',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          hoverBg: 'rgba(0, 0, 0, 0.03)',
          conflictBg: 'rgba(239, 68, 68, 0.15)',
          conflictSelectedBg: 'rgba(239, 68, 68, 0.2)',
          conflictBorder: 'rgba(239, 68, 68, 0.5)',
          conflictText: '#dc2626',
          singleBg: 'rgba(34, 197, 94, 0.25)',
          selectionBg: 'rgba(99, 102, 241, 0.15)',
          relatedTint: 'rgba(99, 102, 241, 0.07)',
          shareTint: 'rgba(6, 182, 212, 0.2)',
          padBorder: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
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
    MuiCssBaseline: {
      // Scrollbar styling moved here from index.css so it follows the theme.
      // Var names are deterministic: --mui-palette-<path with dots as dashes>.
      styleOverrides: {
        '::-webkit-scrollbar': { width: '8px', height: '8px' },
        '::-webkit-scrollbar-track': {
          background: 'var(--mui-palette-background-default)',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'var(--mui-palette-board-frame)',
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'var(--mui-palette-board-line)',
        },
      },
    },
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
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backgroundColor: 'var(--mui-palette-background-paper)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
          },
          ...theme.applyStyles('light', {
            border: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.08)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.12)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
            },
          }),
        }),
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
        root: ({ theme }) => ({
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundImage: 'none',
          ...theme.applyStyles('light', {
            backgroundColor: 'rgba(248, 250, 252, 0.8)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            color: '#0f172a',
          }),
        }),
      },
    },
  },
});

export default responsiveFontSizes(theme);
