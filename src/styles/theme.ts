import { createTheme, Theme } from '@mui/material/styles';
import { WidgetConfig } from '@/types';

// Extend the Palette to include custom colors if needed
declare module '@mui/material/styles' {
  interface Theme {
    custom?: {
      borderRadius: number;
      glassmorphism?: boolean;
    };
  }
  interface ThemeOptions {
    custom?: {
      borderRadius?: number;
      glassmorphism?: boolean;
    };
  }
}

export function createWidgetTheme(config: WidgetConfig): Theme {
  const ui = config.theme || {};
  const primaryColor = ui.primaryColor || config.primaryColor || '#1976d2';
  const secondaryColor = ui.secondaryColor || '#f50057';
  const fontFamily = ui.fontFamily || '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Radius mapping
  const radiusMap: Record<string, number> = {
    'none': 0,
    'small': 4,
    'medium': 12,
    'large': 20,
    'full': 28 // Chat bubble style
  };
  const borderRadius = radiusMap[ui.borderRadius || 'large'];

  return createTheme({
    palette: {
      primary: { main: primaryColor },
      secondary: { main: secondaryColor },
      background: {
        default: ui.backgroundColor || '#ffffff',
        paper: ui.enableGlassmorphism ? 'rgba(255, 255, 255, 0.85)' : (ui.backgroundColor || '#ffffff'),
      },
    },
    typography: {
      fontFamily: fontFamily,
      fontSize: 14,
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      subtitle2: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      }
    },
    shadows: Array(25).fill('none') as any, // Reset defaults, we will use custom shadows
    shape: {
      borderRadius: borderRadius,
    },
    custom: {
      borderRadius,
      glassmorphism: ui.enableGlassmorphism,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: ${fontFamily}; }
        `,
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: borderRadius,
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
          },
          contained: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backdropFilter: ui.enableGlassmorphism ? 'blur(12px)' : 'none',
            border: ui.enableGlassmorphism ? '1px solid rgba(255,255,255,0.3)' : 'none',
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
    },
  });
}
