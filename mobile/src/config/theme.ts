/**
 * RIVA Design System - Theme Configuration
 * Based on docs/ui-ux/DESIGN-SYSTEM.md
 * Concept: Premium Minimalism
 * Motto: "Încredere prin Simplitate"
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Primary Brand Colors
  primary: {
    main: "#1e3a5f", // Deep Navy - Autoritate & Încredere
    light: "#2d5a87", // Hover state
    dark: "#0f1d2f", // Active state
  },

  // Accent Colors
  accent: {
    main: "#10b981", // Emerald - Succes & Acțiune
    light: "#34d399", // Hover
    dark: "#059669", // Active
  },

  // Secondary Colors
  secondary: {
    main: "#6366f1", // Indigo - AI & Interactiv
    warning: "#f59e0b", // Amber - Atenție & Premium Badge
    error: "#ef4444", // Red - Erori
    info: "#3b82f6", // Blue - Informații
  },

  // Neutrals - Light Mode
  light: {
    background: "#f8fafc", // Fundal principal
    surface: "#ffffff", // Carduri, modals
    surfaceElevated: "#ffffff",
    textPrimary: "#0f172a", // Titluri, text principal
    textSecondary: "#64748b", // Text secundar, hints
    textTertiary: "#94a3b8", // Placeholder, disabled
    border: "#e2e8f0", // Borduri subtile
    divider: "#f1f5f9", // Separatoare
  },

  // Neutrals - Dark Mode
  dark: {
    background: "#0f172a", // Deep navy, NOT pure black
    surface: "#1e293b", // Carduri
    surfaceElevated: "#334155",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textTertiary: "#64748b",
    border: "#334155",
    divider: "#1e293b",
  },
} as const;

// ============================================
// GRADIENTS
// ============================================

export const gradients = {
  primary: ["#1e3a5f", "#2d5a87"],
  accent: ["#10b981", "#059669"],
  ai: ["#6366f1", "#8b5cf6", "#10b981"],
  gold: ["#f59e0b", "#d97706"],
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  // Font Families
  fontFamily: {
    primary: "Inter",
    fallback: "System",
  },

  // Font Sizes
  fontSize: {
    xs: 12, // Captions, labels mici
    sm: 14, // Text secundar
    base: 16, // Body text - BASE
    lg: 18, // Body emphasized
    xl: 20, // Subtitluri
    "2xl": 24, // Titluri secțiuni
    "3xl": 30, // Titluri ecrane
    "4xl": 36, // Hero text
    "5xl": 48, // Display - folosit rar
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Weights
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

// ============================================
// SPACING (8pt Grid)
// ============================================

export const spacing = {
  0: 0,
  1: 4, // Minimal - între iconițe și text
  2: 8, // Tight - padding intern mic
  3: 12, // Small
  4: 16, // Base - padding standard
  5: 20, // Medium
  6: 24, // Large
  8: 32, // XLarge - între secțiuni
  10: 40, // XXLarge
  12: 48, // Mega - header height
  16: 64, // Ultra
  20: 80, // Hero sections
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: 0,
  sm: 4, // Tags, badges mici
  md: 8, // Inputs, butoane mici
  lg: 12, // Butoane principale
  xl: 16, // Carduri
  "2xl": 20, // Carduri mari, bottom sheets
  "3xl": 24, // Modals
  full: 9999, // Pills, avatare
} as const;

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  sm: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 25,
    elevation: 8,
  },
  card: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// ============================================
// ANIMATION TIMING
// ============================================

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
    complex: 500,
  },
  easing: {
    easeOut: "ease-out",
    easeIn: "ease-in",
    easeInOut: "ease-in-out",
  },
} as const;

// ============================================
// COMPONENT SIZES
// ============================================

export const componentSizes = {
  button: {
    height: 52,
    iconSize: 20,
  },
  input: {
    height: 52,
  },
  bottomNav: {
    height: 56,
    iconSize: 24,
  },
  avatar: {
    sm: 32,
    md: 48,
    lg: 80,
  },
  touchTarget: {
    min: 44,
    recommended: 48,
  },
} as const;

// ============================================
// THEME OBJECT
// ============================================

export type ThemeMode = "light" | "dark" | "system";

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: typeof colors.primary;
    accent: typeof colors.accent;
    secondary: typeof colors.secondary;
    background: string;
    surface: string;
    surfaceElevated: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    divider: string;
  };
  gradients: typeof gradients;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  animation: typeof animation;
  componentSizes: typeof componentSizes;
}

export const createTheme = (mode: "light" | "dark"): Theme => {
  const colorMode = mode === "dark" ? colors.dark : colors.light;

  return {
    mode,
    colors: {
      primary: colors.primary,
      accent: colors.accent,
      secondary: colors.secondary,
      background: colorMode.background,
      surface: colorMode.surface,
      surfaceElevated: colorMode.surfaceElevated,
      textPrimary: colorMode.textPrimary,
      textSecondary: colorMode.textSecondary,
      textTertiary: colorMode.textTertiary,
      border: colorMode.border,
      divider: colorMode.divider,
    },
    gradients,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
    componentSizes,
  };
};

export const lightTheme = createTheme("light");
export const darkTheme = createTheme("dark");

export default lightTheme;
