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
      contrastText: '#FFFFFF', // --destructive-foreground
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
      secondary: '#6B7280', // $--muted-foreground (darkened for contrast)
      disabled: '#9CA3AF',
    },
    divider: '#D9DBE1', // $--border
    action: {
      hover: '#F0F0F3',              // $--muted
      selected: 'rgba(43, 45, 66, 0.08)',
      disabled: '#D9DBE1',
    },
  },
  typography: {
    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
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
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&.Mui-disabled': {
            backgroundColor: '#D9DBE1',
            color: '#8D99AE',
            opacity: 0.7,
          },
          '& .MuiButton-startIcon svg, & .MuiButton-endIcon svg': { width: 16, height: 16 },
          '&.MuiButton-sizeLarge .MuiButton-startIcon svg, &.MuiButton-sizeLarge .MuiButton-endIcon svg': { width: 18, height: 18 },
          '&.MuiButton-sizeSmall .MuiButton-startIcon svg, &.MuiButton-sizeSmall .MuiButton-endIcon svg': { width: 14, height: 14 },
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
  main: '#d97706', // amber, matching --accent-warm
  dark: '#b45309',
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

