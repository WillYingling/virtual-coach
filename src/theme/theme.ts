import { createTheme, type Theme } from "@mui/material";

// Design tokens for easy customization
export const designTokens = {
  // Colors
  colors: {
    primary: "#1976d2",
    secondary: "#dc004e",
    success: "#2e7d32",
    warning: "#ed6c02",
    error: "#d32f2f",
    background: {
      default: "#121212",
      paper: "#1e1e1e",
      surface: "#252525",
    },
    text: {
      primary: "rgba(255, 255, 255, 0.87)",
      secondary: "rgba(255, 255, 255, 0.60)",
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Mobile-specific sizing
  mobile: {
    touchTarget: {
      small: 44,
      medium: 48,
      large: 56,
    },
    typography: {
      skillName: {
        mobile: "1rem",
        desktop: "0.875rem",
      },
      difficulty: {
        mobile: "0.875rem",
        desktop: "0.75rem",
      },
    },
    spacing: {
      card: {
        mobile: 12,
        desktop: 8,
      },
      section: {
        mobile: 16,
        desktop: 12,
      },
    },
  },

  // Border radius
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    card: 12,
  },

  // Typography
  typography: {
    fontWeights: {
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
    },
  },

  // Component sizes
  components: {
    iconButton: {
      small: 32, // Increased from 28 for better touch targets
      medium: 40, // Increased from 32
      large: 48, // Increased from 40
    },
    chip: {
      small: 24, // Increased from 20
      medium: 28, // Increased from 24
    },
  },

  // Chip color variants
  chipColors: {
    selected: {
      background: "#2e7d32", // success.main
      text: "#ffffff",
      border: "#1b5e20", // success.dark
      glow: "rgba(46, 125, 50, 0.3)",
    },
    unselected: {
      background: "rgba(255, 255, 255, 0.08)",
      text: "rgba(255, 255, 255, 0.7)",
      border: "rgba(255, 255, 255, 0.23)",
      hover: {
        background: "rgba(255, 255, 255, 0.12)",
        text: "rgba(255, 255, 255, 0.87)",
      },
    },
  },
};

// Create the theme
export const createAppTheme = (): Theme =>
  createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    palette: {
      mode: "dark",
      primary: {
        main: designTokens.colors.primary,
      },
      secondary: {
        main: designTokens.colors.secondary,
      },
      success: {
        main: designTokens.colors.success,
      },
      warning: {
        main: designTokens.colors.warning,
      },
      error: {
        main: designTokens.colors.error,
      },
      background: {
        default: designTokens.colors.background.default,
        paper: designTokens.colors.background.paper,
      },
      text: {
        primary: designTokens.colors.text.primary,
        secondary: designTokens.colors.text.secondary,
      },
    },

    typography: {
      h4: {
        fontWeight: designTokens.typography.fontWeights.semiBold,
      },
      h6: {
        fontWeight: designTokens.typography.fontWeights.medium,
      },
    },

    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.card,
            backgroundImage: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.medium,
            textTransform: "none",
            fontWeight: designTokens.typography.fontWeights.medium,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: {
            borderColor: "rgba(255, 255, 255, 0.12)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.small,
          },
        },
      },
      // Override any potential width constraints
      MuiContainer: {
        styleOverrides: {
          root: {
            maxWidth: "none !important",
            width: "100% !important",
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            maxWidth: "none !important",
            width: "100% !important",
          },
        },
      },
    },
  });

// Helper function to create consistent spacing
export const getSpacing = (multiplier: number = 1) =>
  `${designTokens.spacing.sm * multiplier}px`;

// Common component styles
export const commonStyles = {
  iconButton: {
    small: {
      width: designTokens.components.iconButton.small,
      height: designTokens.components.iconButton.small,
    },
    medium: {
      width: designTokens.components.iconButton.medium,
      height: designTokens.components.iconButton.medium,
    },
  },

  chip: {
    small: {
      height: designTokens.components.chip.small,
      fontSize: "0.75rem",
    },
    medium: {
      height: designTokens.components.chip.medium,
      fontSize: "0.875rem",
    },
  },

  flexCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  flexBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
};
