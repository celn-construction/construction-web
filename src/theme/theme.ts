import { createTheme, type Theme } from '@mui/material/styles';

// Light theme - monochrome (black, gray, white)
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#171717', // near-black
      light: '#404040',
      dark: '#000000',
    },
    secondary: {
      main: '#737373', // medium gray
      light: '#a3a3a3',
      dark: '#525252',
    },
    error: {
      main: '#404040', // dark gray (monochrome)
      light: '#737373',
      dark: '#171717',
    },
    warning: {
      main: '#525252', // medium-dark gray (monochrome)
      light: '#737373',
      dark: '#404040',
    },
    info: {
      main: '#525252', // medium-dark gray (monochrome)
      light: '#737373',
      dark: '#404040',
    },
    success: {
      main: '#525252', // medium-dark gray (monochrome)
      light: '#737373',
      dark: '#404040',
    },
    background: {
      default: '#fafafa', // off-white
      paper: '#ffffff', // white
    },
    text: {
      primary: '#171717', // near-black
      secondary: '#737373', // medium gray
      disabled: '#a3a3a3', // light gray
    },
    divider: '#e5e5e5', // very light gray
    action: {
      hover: '#f5f5f5', // very light gray
      selected: 'rgba(23, 23, 23, 0.06)',
      disabled: '#d4d4d4',
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
  background: '#ffffff',
};
lightTheme.palette.input = {
  background: '#f5f5f5',
};
lightTheme.palette.sidebar = {
  background: '#f5f5f5',
  border: 'rgba(0, 0, 0, 0.08)',
  indicator: '#171717',
  activeBg: 'rgba(23, 23, 23, 0.06)',
  hoverBg: 'rgba(23, 23, 23, 0.04)',
};
lightTheme.palette.warm = {
  main: '#171717', // monochrome - black instead of orange
  dark: '#000000',
};
lightTheme.palette.grid = {
  line: 'rgba(0, 0, 0, 0.04)',
};
lightTheme.palette.timeline = {
  accent: '#171717',
  accentSubtle: 'rgba(23, 23, 23, 0.06)',
};

// Dark theme - monochrome (black, gray, white)
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#fafafa', // off-white
      light: '#ffffff',
      dark: '#d4d4d4',
    },
    secondary: {
      main: '#a3a3a3', // light gray
      light: '#d4d4d4',
      dark: '#737373',
    },
    error: {
      main: '#d4d4d4', // light gray (monochrome)
      light: '#fafafa',
      dark: '#a3a3a3',
    },
    warning: {
      main: '#a3a3a3', // medium-light gray (monochrome)
      light: '#d4d4d4',
      dark: '#737373',
    },
    info: {
      main: '#a3a3a3', // medium-light gray (monochrome)
      light: '#d4d4d4',
      dark: '#737373',
    },
    success: {
      main: '#a3a3a3', // medium-light gray (monochrome)
      light: '#d4d4d4',
      dark: '#737373',
    },
    background: {
      default: '#0a0a0a', // near-black
      paper: '#141414', // very dark gray
    },
    text: {
      primary: '#fafafa', // off-white
      secondary: '#a3a3a3', // light gray
      disabled: '#737373', // medium gray
    },
    divider: '#262626', // dark gray
    action: {
      hover: '#1f1f1f', // very dark gray
      selected: 'rgba(250, 250, 250, 0.06)',
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
  background: '#171717',
};
darkTheme.palette.input = {
  background: '#1f1f1f',
};
darkTheme.palette.sidebar = {
  background: '#111111',
  border: 'rgba(255, 255, 255, 0.08)',
  indicator: '#fafafa',
  activeBg: 'rgba(250, 250, 250, 0.08)',
  hoverBg: 'rgba(250, 250, 250, 0.04)',
};
darkTheme.palette.warm = {
  main: '#fafafa', // monochrome - white instead of yellow
  dark: '#d4d4d4',
};
darkTheme.palette.grid = {
  line: 'rgba(255, 255, 255, 0.04)',
};
darkTheme.palette.timeline = {
  accent: '#fafafa',
  accentSubtle: 'rgba(250, 250, 250, 0.06)',
};
