import { createTheme, alpha, type Theme } from '@mui/material/styles';

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
      default: '#f7f8f8', // Linear light bg
      paper: '#FFFFFF',   // $--card
    },
    text: {
      primary: '#1A1A2E',
      // Linear's #8a8f98 fails WCAG AA against light backgrounds (~2.9:1).
      // Use Tailwind gray-500 for ~4.3:1 in light. Dark mode keeps #8a8f98.
      secondary: '#6b7280',
      disabled: '#62666d',
    },
    divider: '#e6e6e6', // Linear light border
    action: {
      hover: 'rgba(0,0,0,0.02)',        // Linear ghost background
      selected: 'rgba(43, 45, 66, 0.08)',
      disabled: '#e6e6e6',
    },
  },
  typography: {
    // Geist for body/UI, JetBrains Mono reserved for code/tabular/technical labels.
    fontFamily:
      'var(--font-geist-sans), "SF Pro Display", -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    // Linear's three-tier weight system: 400 (body), 510 (UI/emphasis), 590 (headings)
    fontWeightRegular: 400,
    fontWeightMedium: 510,
    fontWeightBold: 590,
    h1: { fontSize: '2rem', fontWeight: 590, lineHeight: 1.13, letterSpacing: '-0.704px' },
    h2: { fontSize: '1.5rem', fontWeight: 590, lineHeight: 1.33, letterSpacing: '-0.288px' },
    h3: { fontSize: '1.25rem', fontWeight: 590, lineHeight: 1.33, letterSpacing: '-0.24px' },
    h4: { fontSize: '1.125rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '-0.2px' },
    h5: { fontSize: '1rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '-0.165px' },
    h6: { fontSize: '0.875rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '-0.1px' },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 510, lineHeight: 1.5, letterSpacing: '-0.165px' },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 510, lineHeight: 1.5, letterSpacing: '-0.13px' },
    body1: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.5, letterSpacing: '-0.13px' },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4 },
    overline: { fontSize: '0.6875rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase' },
    button: { fontSize: '0.8125rem', fontWeight: 510, letterSpacing: 'normal', textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f7f8f8',
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: 'box-shadow 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider,
            transition: 'border-color 0.15s ease',
          },
          '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.text.primary, 0.32),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
          },
        }),
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
      // Glass-mode tokens. Sidebar paints a navy bokeh + frost overlay
      // independently of theme mode (always-dark surface) so these have
      // identical values in lightTheme and darkTheme.
      glassBg: string;
      glassBgImage: string;
      glassFrostBg: string;
      glassText: string;
      glassTextSecondary: string;
      glassBorder: string;
      glassIndicator: string;
      glassActiveItemBg: string;
      glassHoverBg: string;
      glassChipBg: string;
    };
    header: {
      background: string;
      backgroundImage: string;
      borderColor: string;
      boxShadow: string;
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
      glassBg?: string;
      glassBgImage?: string;
      glassFrostBg?: string;
      glassText?: string;
      glassTextSecondary?: string;
      glassBorder?: string;
      glassIndicator?: string;
      glassActiveItemBg?: string;
      glassHoverBg?: string;
      glassChipBg?: string;
    };
    header?: {
      background?: string;
      backgroundImage?: string;
      borderColor?: string;
      boxShadow?: string;
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
// Sidebar glass tokens — the sidebar paints navy bokeh + a frost overlay
// regardless of theme mode (always-dark surface), so identical values are
// applied to both lightTheme and darkTheme below.
const SIDEBAR_GLASS_BG_IMAGE = `radial-gradient(circle at 20% 18%, rgba(80, 130, 255, 0.45) 0%, transparent 38%),
radial-gradient(circle at 80% 25%, rgba(40, 200, 240, 0.30) 0%, transparent 40%),
radial-gradient(circle at 30% 75%, rgba(120, 90, 255, 0.38) 0%, transparent 42%),
radial-gradient(circle at 90% 90%, rgba(60, 110, 220, 0.38) 0%, transparent 40%),
radial-gradient(circle at 50% 50%, rgba(8, 16, 40, 0.55) 0%, rgba(3, 8, 20, 0.92) 78%)`;

const sidebarGlassTokens = {
  glassBg: '#050d24',
  glassBgImage: SIDEBAR_GLASS_BG_IMAGE,
  glassFrostBg: 'rgba(8, 16, 40, 0.18)',
  glassText: '#ffffff',
  glassTextSecondary: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassIndicator: '#ffffff',
  glassActiveItemBg: 'rgba(255, 255, 255, 0.16)',
  glassHoverBg: 'rgba(255, 255, 255, 0.10)',
  glassChipBg: 'rgba(255, 255, 255, 0.18)',
} as const;

lightTheme.palette.sidebar = {
  background: '#FFFFFF',   // $--sidebar
  border: '#D9DBE1',       // $--sidebar-border
  indicator: '#2B2D42',    // active bar
  activeBg: '#FFFFFF',     // $--card
  hoverBg: '#F0F0F3',      // $--sidebar-accent
  activeItemBg: '#FFFFFF',
  ...sidebarGlassTokens,
};
// Header — gradient ribbon + atmospheric depth. Reads as white but the
// edges pick up the sidebar's blue (#5082FF) and purple (#785AFF) hues at
// low alpha. The boxShadow stack adds a 1px inner-top highlight (catches
// light against the ribbon) plus a faint navy-tinted bottom glow that
// echoes the sidebar's `rgba(5,13,36,…)` shadow — pulls the sidebar's
// atmosphere across the top of the page without going dark.
lightTheme.palette.header = {
  background: '#ffffff',
  backgroundImage:
    'linear-gradient(90deg, rgba(80, 130, 255, 0.06) 0%, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0) 65%, rgba(120, 90, 255, 0.06) 100%)',
  borderColor: 'rgba(8, 16, 40, 0.06)',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 1), 0 1px 0 rgba(8, 16, 40, 0.03), 0 6px 24px -12px rgba(5, 13, 36, 0.18)',
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

// Dark theme — Linear-inspired dark surfaces + navy lifted to a lighter variant for contrast.
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4A4D6A',     // lighter navy so it reads on dark
      light: '#6B6F8D',
      dark: '#2B2D42',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#191a1b',
      light: '#28282c',
      dark: '#0f1011',
    },
    error: {
      main: '#F87171',
      light: '#FCA5A5',
      dark: '#DC2626',
      contrastText: '#0f1011',
    },
    warning: {
      main: '#FBBF24',
      light: '#FCD34D',
      dark: '#D97706',
    },
    info: {
      main: '#7170ff',
      light: '#828fff',
      dark: '#5e6ad2',
    },
    success: {
      main: '#34D399',
      light: '#6EE7B7',
      dark: '#10B981',
    },
    background: {
      default: '#0f1011', // Linear panel dark
      paper: '#191a1b',   // Linear level 3 surface
    },
    text: {
      primary: '#f7f8f8',
      secondary: '#8a8f98',
      disabled: '#62666d',
    },
    divider: 'rgba(255,255,255,0.08)',
    action: {
      hover: 'rgba(255,255,255,0.04)',
      selected: 'rgba(255,255,255,0.06)',
      disabled: 'rgba(255,255,255,0.08)',
    },
  },
  typography: {
    fontFamily:
      'var(--font-geist-sans), "SF Pro Display", -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 510,
    fontWeightBold: 590,
    h1: { fontSize: '2rem', fontWeight: 590, lineHeight: 1.13, letterSpacing: '-0.704px' },
    h2: { fontSize: '1.5rem', fontWeight: 590, lineHeight: 1.33, letterSpacing: '-0.288px' },
    h3: { fontSize: '1.25rem', fontWeight: 590, lineHeight: 1.33, letterSpacing: '-0.24px' },
    h4: { fontSize: '1.125rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '-0.2px' },
    h5: { fontSize: '1rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '-0.165px' },
    h6: { fontSize: '0.875rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '-0.1px' },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 510, lineHeight: 1.5, letterSpacing: '-0.165px' },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 510, lineHeight: 1.5, letterSpacing: '-0.13px' },
    body1: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.5, letterSpacing: '-0.13px' },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4 },
    overline: { fontSize: '0.6875rem', fontWeight: 590, lineHeight: 1.4, letterSpacing: '0.12em', textTransform: 'uppercase' },
    button: { fontSize: '0.8125rem', fontWeight: 510, letterSpacing: 'normal', textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0f1011',
          color: '#f7f8f8',
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
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: '#62666d',
            opacity: 0.7,
          },
          '& .MuiButton-startIcon svg, & .MuiButton-endIcon svg': { width: 16, height: 16 },
          '&.MuiButton-sizeLarge .MuiButton-startIcon svg, &.MuiButton-sizeLarge .MuiButton-endIcon svg': { width: 18, height: 18 },
          '&.MuiButton-sizeSmall .MuiButton-startIcon svg, &.MuiButton-sizeSmall .MuiButton-endIcon svg': { width: 14, height: 14 },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: 'box-shadow 0.15s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider,
            transition: 'border-color 0.15s ease',
          },
          '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.text.primary, 0.32),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
          },
        }),
      },
    },
  },
});

darkTheme.palette.card = {
  background: '#191a1b',
};
darkTheme.palette.input = {
  background: 'rgba(255,255,255,0.04)',
};
darkTheme.palette.sidebar = {
  // Sidebar sits one step deeper than main content so it visually recedes
  // and the main work area lifts — mirrors light mode where sidebar is the
  // brighter surface above main. Three-tier dark stack: sidebar #08090a <
  // main #0f1011 < cards/paper #191a1b.
  background: '#08090a',
  border: 'rgba(255,255,255,0.08)',
  indicator: '#f7f8f8',
  activeBg: '#191a1b',
  hoverBg: 'rgba(255,255,255,0.04)',
  activeItemBg: '#191a1b',
  ...sidebarGlassTokens,
};
// Dark header — same gradient ribbon (alpha bumped) plus a dark-mode
// translation of the atmospheric glow. The navy glow doesn't translate
// into dark mode (it would blend into the already-dark page), so the
// bottom shadow uses a faint sidebar-blue tint instead — same hue family,
// keeps the cohesion. Inner highlight drops to 6% white to match the
// existing dark-mode glass treatment in the sidebar.
darkTheme.palette.header = {
  background: '#191a1b',
  backgroundImage:
    'linear-gradient(90deg, rgba(80, 130, 255, 0.10) 0%, rgba(25, 26, 27, 0) 35%, rgba(25, 26, 27, 0) 65%, rgba(120, 90, 255, 0.10) 100%)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 1px 0 rgba(0, 0, 0, 0.25), 0 6px 24px -12px rgba(80, 130, 255, 0.12)',
};
darkTheme.palette.accent = {
  dark: '#f7f8f8',
  gradientEnd: '#d0d6e0',
};
darkTheme.palette.status = {
  active: '#22C55E',
  inProgress: '#F59E0B',
  onHold: '#8D99AE',
  completed: '#3B82F6',
  archived: '#8D99AE',
  activeBg: 'rgba(34,197,94,0.15)',
  activeText: '#4ade80',
  inProgressBg: 'rgba(245,158,11,0.15)',
  inProgressText: '#fbbf24',
  badge: '#E67E22',
};
darkTheme.palette.warm = {
  main: '#F59E0B',
  dark: '#D97706',
};
darkTheme.palette.grid = {
  line: 'rgba(255,255,255,0.06)',
};
darkTheme.palette.timeline = {
  accent: '#f7f8f8',
  accentSubtle: 'rgba(255,255,255,0.06)',
};
darkTheme.palette.docExplorer = {
  destructiveMain: '#f87171',
  destructiveDark: '#ef4444',
  destructiveLight: 'rgba(239,68,68,0.12)',
  linkedGreen: '#34d399',
  badgeBg: 'rgba(255,255,255,0.08)',
  aiPurple: '#c084fc',
};

