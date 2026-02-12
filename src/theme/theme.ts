import { createTheme, type Theme } from '@mui/material/styles';

// Light theme matching existing CSS variables
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#171717', // --accent-primary
    },
    secondary: {
      main: '#737373', // --text-secondary
    },
    error: {
      main: '#dc2626', // --status-red
    },
    warning: {
      main: '#d97706', // --status-amber
    },
    info: {
      main: '#2563eb', // --status-blue
    },
    success: {
      main: '#16a34a', // --status-green
    },
    background: {
      default: '#fafafa', // --bg-primary
      paper: '#ffffff', // --bg-secondary
    },
    text: {
      primary: '#171717', // --text-primary
      secondary: '#737373', // --text-secondary
      disabled: '#a3a3a3', // --text-muted
    },
    divider: '#e5e5e5', // --border-color
    action: {
      hover: '#f0f0f0', // --bg-hover
      selected: 'rgba(23, 23, 23, 0.06)', // --accent-subtle
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 8, // matches rounded-lg
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fafafa',
          color: '#171717',
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
    };
    warm: {
      main: string;
      hover: string;
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
    };
    warm?: {
      main?: string;
      hover?: string;
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
  background: '#ffffff', // --bg-card
};
lightTheme.palette.input = {
  background: '#f5f5f5', // --bg-input
};
lightTheme.palette.sidebar = {
  background: '#f5f5f5', // --bg-sidebar
  border: 'rgba(0, 0, 0, 0.08)', // --sidebar-border
  indicator: '#171717', // --sidebar-indicator
  activeBg: 'rgba(23, 23, 23, 0.06)', // --sidebar-active-bg
  hoverBg: 'rgba(23, 23, 23, 0.04)', // --sidebar-hover-bg
};
lightTheme.palette.warm = {
  main: '#d97706', // --accent-warm
  hover: '#b45309', // --accent-warm-hover
};
lightTheme.palette.grid = {
  line: 'rgba(0, 0, 0, 0.04)', // --grid-line
};
lightTheme.palette.timeline = {
  accent: '#171717', // --timeline-accent
  accentSubtle: 'rgba(23, 23, 23, 0.06)', // --timeline-accent-subtle
};

// Dark theme matching existing CSS variables
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#fafafa', // --accent-primary
    },
    secondary: {
      main: '#a3a3a3', // --text-secondary
    },
    error: {
      main: '#f87171', // --status-red
    },
    warning: {
      main: '#fbbf24', // --status-amber
    },
    info: {
      main: '#60a5fa', // --status-blue
    },
    success: {
      main: '#4ade80', // --status-green
    },
    background: {
      default: '#0a0a0a', // --bg-primary
      paper: '#141414', // --bg-secondary
    },
    text: {
      primary: '#fafafa', // --text-primary
      secondary: '#a3a3a3', // --text-secondary
      disabled: '#737373', // --text-muted
    },
    divider: '#262626', // --border-color
    action: {
      hover: '#262626', // --bg-hover
      selected: 'rgba(250, 250, 250, 0.06)', // --accent-subtle
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 8, // matches rounded-lg
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          transition: 'background-color 0.15s ease, color 0.15s ease',
        },
      },
    },
  },
});

// Add custom properties to dark theme
darkTheme.palette.card = {
  background: '#171717', // --bg-card
};
darkTheme.palette.input = {
  background: '#1f1f1f', // --bg-input
};
darkTheme.palette.sidebar = {
  background: '#111111', // --bg-sidebar
  border: 'rgba(255, 255, 255, 0.08)', // --sidebar-border
  indicator: '#fafafa', // --sidebar-indicator
  activeBg: 'rgba(250, 250, 250, 0.08)', // --sidebar-active-bg
  hoverBg: 'rgba(250, 250, 250, 0.04)', // --sidebar-hover-bg
};
darkTheme.palette.warm = {
  main: '#fbbf24', // --accent-warm
  hover: '#f59e0b', // --accent-warm-hover
};
darkTheme.palette.grid = {
  line: 'rgba(255, 255, 255, 0.04)', // --grid-line
};
darkTheme.palette.timeline = {
  accent: '#fafafa', // --timeline-accent
  accentSubtle: 'rgba(250, 250, 250, 0.06)', // --timeline-accent-subtle
};
