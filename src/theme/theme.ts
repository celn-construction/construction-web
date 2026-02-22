import { createTheme, type Theme } from '@mui/material/styles';

// Light theme — matches construction.pen $--variable tokens
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF8400', // $--primary
      light: '#FF9933',
      dark: '#CC6A00',
      contrastText: '#111111', // $--primary-foreground
    },
    secondary: {
      main: '#F0F0F3', // $--secondary (subtle bg)
      light: '#F8F8FB',
      dark: '#D9DBE1',
    },
    error: {
      main: '#D93C15', // $--destructive
      light: '#E8644A',
      dark: '#B02E0F',
    },
    warning: {
      main: '#804200',
      light: '#A35400',
      dark: '#5C2F00',
    },
    info: {
      main: '#000066',
      light: '#0000A3',
      dark: '#000040',
    },
    success: {
      main: '#004D1A',
      light: '#006B24',
      dark: '#003010',
    },
    background: {
      default: '#F0F0F3', // $--background
      paper: '#FFFFFF',   // $--card
    },
    text: {
      primary: '#1A1A2E',  // $--foreground
      secondary: '#8D99AE', // $--muted-foreground
      disabled: '#B0B8C4',
    },
    divider: '#D9DBE1', // $--border
    action: {
      hover: '#F0F0F3',              // $--muted
      selected: 'rgba(43, 45, 66, 0.08)',
      disabled: '#D9DBE1',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F2F3F0',
          color: '#111111',
          transition: 'background-color 0.15s ease, color 0.15s ease',
        },
      },
    },
  },
});

// Extend theme with custom properties
declare module '@mui/material/styles' {
  interface Palette {
    card: {
      background: string;
    };
    input: {
      background: string;
    };
    sidebar: {
      background: string;
      border: string;
      indicator: string;
      activeBg: string;
      hoverBg: string;
      activeItemBg: string;
    };
    warm: {
      main: string;
      dark: string;
    };
    grid: {
      line: string;
    };
    timeline: {
      accent: string;
      accentSubtle: string;
    };
  }
  interface PaletteOptions {
    card?: {
      background?: string;
    };
    input?: {
      background?: string;
    };
    sidebar?: {
      background?: string;
      border?: string;
      indicator?: string;
      activeBg?: string;
      hoverBg?: string;
      activeItemBg?: string;
    };
    warm?: {
      main?: string;
      dark?: string;
    };
    grid?: {
      line?: string;
    };
    timeline?: {
      accent?: string;
      accentSubtle?: string;
    };
  }
}

// Add custom properties to light theme
lightTheme.palette.card = {
  background: '#FFFFFF', // $--card
};
lightTheme.palette.input = {
  background: '#CBCCC9', // $--input
};
lightTheme.palette.sidebar = {
  background: '#FFFFFF',   // $--card (sidebar uses card bg)
  border: '#D9DBE1',       // $--sidebar-border
  indicator: '#2B2D42',    // active bar (dark navy from pen)
  activeBg: '#FFFFFF',     // $--card
  hoverBg: '#F0F0F3',      // $--muted
  activeItemBg: '#FFFFFF', // explicit white for active nav item
};
lightTheme.palette.warm = {
  main: '#FF8400', // $--primary
  dark: '#CC6A00',
};
lightTheme.palette.grid = {
  line: 'rgba(0, 0, 0, 0.04)',
};
lightTheme.palette.timeline = {
  accent: '#FF8400',              // $--primary
  accentSubtle: 'rgba(255, 132, 0, 0.1)',
};

// Dark theme — matches construction.pen dark mode $--variable tokens
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF8400', // $--primary (same orange in dark)
      light: '#FF9933',
      dark: '#CC6A00',
      contrastText: '#111111', // $--primary-foreground
    },
    secondary: {
      main: '#2E2E2E', // $--secondary (dark)
      light: '#3A3A3A',
      dark: '#1E1E1E',
    },
    error: {
      main: '#FF5C33', // $--destructive (dark)
      light: '#FF7A5C',
      dark: '#CC3A1F',
    },
    warning: {
      main: '#FF8400',
      light: '#FF9933',
      dark: '#CC6A00',
    },
    info: {
      main: '#B2B2FF',
      light: '#D4D4FF',
      dark: '#8080CC',
    },
    success: {
      main: '#B6FFCE',
      light: '#D4FFE2',
      dark: '#80CCA0',
    },
    background: {
      default: '#111111', // $--background (dark)
      paper: '#1A1A1A',   // $--card (dark)
    },
    text: {
      primary: '#FFFFFF',  // $--foreground (dark)
      secondary: '#B8B9B6', // $--muted-foreground (dark)
      disabled: '#737373',
    },
    divider: '#2E2E2E', // $--border (dark)
    action: {
      hover: '#2E2E2E',              // $--muted (dark)
      selected: 'rgba(255, 132, 0, 0.1)',
      disabled: '#404040',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#111111',
          color: '#FFFFFF',
          transition: 'background-color 0.15s ease, color 0.15s ease',
        },
      },
    },
  },
});

// Add custom properties to dark theme
darkTheme.palette.card = {
  background: '#1A1A1A', // $--card (dark)
};
darkTheme.palette.input = {
  background: '#2E2E2E', // $--input (dark)
};
darkTheme.palette.sidebar = {
  background: '#1A1A1A',                   // $--card (dark)
  border: 'rgba(255, 255, 255, 0.10)',     // $--sidebar-border (dark)
  indicator: '#FFFFFF',                    // active bar (white on dark)
  activeBg: 'rgba(255, 255, 255, 0.10)',
  hoverBg: 'rgba(255, 255, 255, 0.06)',
  activeItemBg: 'rgba(255, 255, 255, 0.10)',
};
darkTheme.palette.warm = {
  main: '#FF8400', // $--primary
  dark: '#CC6A00',
};
darkTheme.palette.grid = {
  line: 'rgba(255, 255, 255, 0.04)',
};
darkTheme.palette.timeline = {
  accent: '#FF8400',              // $--primary
  accentSubtle: 'rgba(255, 132, 0, 0.1)',
};
