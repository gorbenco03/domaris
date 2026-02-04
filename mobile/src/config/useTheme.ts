/**
 * RIVA - useTheme Hook
 * Simple theme provider for components
 */

import React, { useContext } from 'react';

// Define theme structure that matches our components
export const theme = {
  colors: {
    primary: '#1e3a5f',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    divider: '#f1f5f9',
  },
  typography: {
    h2: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      color: '#0f172a',
    },
    h6: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#0f172a',
    },
    body1: {
      fontSize: 16,
      color: '#0f172a',
    },
    body2: {
      fontSize: 14,
      color: '#64748b',
    },
    caption: {
      fontSize: 12,
      color: '#64748b',
    },
  },
};

// Simple theme context for now
const ThemeContext = React.createContext(theme);

export const useTheme = () => {
  return useContext(ThemeContext);
};
