import { createTheme, type Theme } from '@mui/material/styles';

// Light theme — matches construction.pen $--variable tokens (3rd iteration)
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2B2D42', // $--primary
      light: '#4A4D6A',
      dark: '#1A1C2B',
      contrastText: '#FFFFFF', // $--primary-foreground
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
      main: '#8B6914', // $--color-warning-foreground
      light: '#A87E1A',
      dark: '#6E5210',
    },
    info: {
      main: '#000066', // $--color-info-foreground
      light: '#0000A3',
      dark: '#000040',
    },
    success: {
      main: '#3D6B4F', // $--color-success-foreground
      light: '#4F8A65',
      dark: '#2A4C38',
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
          backgroundColor: '#F0F0F3',
          color: '#1A1A2E',
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
    accent: {
      dark: string;
      gradientEnd: string;
    };
    status: {
      active: string;
      inProgress: string;
      onHold: string;
      completed: string;
      archived: string;
      activeBg: string;
      activeText: string;
      inProgressBg: string;
      inProgressText: string;
      badge: string;
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
    docExplorer: {
      destructiveMain: string;
      destructiveDark: string;
      destructiveLight: string;
      linkedGreen: string;
      badgeBg: string;
      aiPurple: string;
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
    accent?: {
      dark?: string;
      gradientEnd?: string;
    };
    status?: {
      active?: string;
      inProgress?: string;
      onHold?: string;
      completed?: string;
      archived?: string;
      activeBg?: string;
      activeText?: string;
      inProgressBg?: string;
      inProgressText?: string;
      badge?: string;
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
    docExplorer?: {
      destructiveMain?: string;
      destructiveDark?: string;
      destructiveLight?: string;
      linkedGreen?: string;
      badgeBg?: string;
      aiPurple?: string;
    };
  }
}

// Add custom properties to light theme
lightTheme.palette.card = {
  background: '#FFFFFF', // $--card
};
lightTheme.palette.input = {
  background: '#D9DBE1', // $--input
};
lightTheme.palette.sidebar = {
  background: '#FFFFFF',   // $--sidebar
  border: '#D9DBE1',       // $--sidebar-border
  indicator: '#2B2D42',    // active bar
  activeBg: '#FFFFFF',     // $--card
  hoverBg: '#F0F0F3',      // $--sidebar-accent
  activeItemBg: '#FFFFFF',
};
lightTheme.palette.accent = {
  dark: '#2B2D42',       // $--primary (dark navy)
  gradientEnd: '#1A1C2B',
};
lightTheme.palette.status = {
  active: '#22C55E',
  inProgress: '#F59E0B',
  onHold: '#8D99AE',
  completed: '#3B82F6',
  archived: '#8D99AE',
  activeBg: '#dcfce7',
  activeText: '#166534',
  inProgressBg: '#fef3c7',
  inProgressText: '#92400e',
  badge: '#E67E22',
};
lightTheme.palette.warm = {
  main: '#2B2D42', // $--primary
  dark: '#1A1C2B',
};
lightTheme.palette.grid = {
  line: 'rgba(0, 0, 0, 0.04)',
};
lightTheme.palette.timeline = {
  accent: '#2B2D42',              // $--primary
  accentSubtle: 'rgba(43, 45, 66, 0.08)',
};
lightTheme.palette.docExplorer = {
  destructiveMain: '#8B4049',
  destructiveDark: '#7a3540',
  destructiveLight: '#F5EDEC',
  linkedGreen: '#059669',
  badgeBg: '#DFDFE6',
  aiPurple: '#A855F7',
};

// Dark theme — matches construction.pen dark mode $--variable tokens
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4A90D9', // $--primary (dark)
      light: '#6BAAE0',
      dark: '#3A7AC4',
      contrastText: '#FFFFFF', // $--primary-foreground (dark)
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
      main: '#FF8400', // $--color-warning-foreground (dark)
      light: '#FFA033',
      dark: '#CC6A00',
    },
    info: {
      main: '#B2B2FF', // $--color-info-foreground (dark)
      light: '#D4D4FF',
      dark: '#8080CC',
    },
    success: {
      main: '#B6FFCE', // $--color-success-foreground (dark)
      light: '#D4FFE2',
      dark: '#80CCA0',
    },
    background: {
      default: '#111111', // $--background (dark)
      paper: '#1A1A1A',   // $--card (dark)
    },
    text: {
      primary: '#FFFFFF',   // $--foreground (dark)
      secondary: '#B8B9B6', // $--muted-foreground (dark)
      disabled: '#737373',
    },
    divider: '#2E2E2E', // $--border (dark)
    action: {
      hover: '#2E2E2E',              // $--muted (dark)
      selected: 'rgba(255, 255, 255, 0.1)',
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
  indicator: '#4A90D9',                    // active bar ($--primary dark)
  activeBg: 'rgba(255, 255, 255, 0.10)',
  hoverBg: 'rgba(255, 255, 255, 0.06)',
  activeItemBg: 'rgba(255, 255, 255, 0.10)',
};
darkTheme.palette.accent = {
  dark: '#4A90D9',                       // $--primary (dark)
  gradientEnd: 'rgba(255, 255, 255, 0.1)',
};
darkTheme.palette.status = {
  active: '#22C55E',
  inProgress: '#F59E0B',
  onHold: '#8D99AE',
  completed: '#3B82F6',
  archived: '#8D99AE',
  activeBg: 'rgba(34, 197, 94, 0.15)',
  activeText: '#86efac',
  inProgressBg: 'rgba(245, 158, 11, 0.15)',
  inProgressText: '#fcd34d',
  badge: '#E67E22',
};
darkTheme.palette.warm = {
  main: '#4A90D9', // $--primary (dark)
  dark: '#3A7AC4',
};
darkTheme.palette.grid = {
  line: 'rgba(255, 255, 255, 0.04)',
};
darkTheme.palette.timeline = {
  accent: '#4A90D9',                     // $--primary (dark)
  accentSubtle: 'rgba(74, 144, 217, 0.15)',
};
darkTheme.palette.docExplorer = {
  destructiveMain: '#C96B75',
  destructiveDark: '#A85862',
  destructiveLight: '#3D2A2C',
  linkedGreen: '#34D399',
  badgeBg: '#3A3A3A',
  aiPurple: '#C084FC',
};
