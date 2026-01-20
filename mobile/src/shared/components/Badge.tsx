/**
 * IMOBI - Badge Component
 * Premium badges for property cards and labels
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

type BadgeVariant = 'primary' | 'accent' | 'warning' | 'error' | 'info' | 'premium' | 'new' | 'verified';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
  testID,
}) => {
  const { theme } = useTheme();

  const sizeStyles: Record<BadgeSize, { paddingHorizontal: number; paddingVertical: number; fontSize: number }> = {
    sm: {
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[1],
      fontSize: theme.typography.fontSize.xs,
    },
    md: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[1] + 2,
      fontSize: theme.typography.fontSize.xs,
    },
    lg: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[2],
      fontSize: theme.typography.fontSize.sm,
    },
  };

  const getVariantColors = (): { background: string; text: string; gradient?: readonly string[] } => {
    switch (variant) {
      case 'primary':
        return { background: theme.colors.primary.main, text: '#ffffff' };
      case 'accent':
        return { background: theme.colors.accent.main, text: '#ffffff' };
      case 'warning':
        return { background: theme.colors.secondary.warning, text: '#ffffff' };
      case 'error':
        return { background: theme.colors.secondary.error, text: '#ffffff' };
      case 'info':
        return { background: theme.colors.secondary.info, text: '#ffffff' };
      case 'premium':
        return { 
          background: '', 
          text: '#ffffff',
          gradient: theme.gradients.gold,
        };
      case 'new':
        return { 
          background: '', 
          text: '#ffffff',
          gradient: theme.gradients.accent,
        };
      case 'verified':
        return { 
          background: '', 
          text: '#ffffff',
          gradient: theme.gradients.primary,
        };
      default:
        return { background: theme.colors.primary.main, text: '#ffffff' };
    }
  };

  const colors = getVariantColors();
  const currentSize = sizeStyles[size];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: currentSize.paddingHorizontal,
    paddingVertical: currentSize.paddingVertical,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  };

  const labelStyle: TextStyle = {
    fontSize: currentSize.fontSize,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  };

  const content = (
    <>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[labelStyle, textStyle]}>{label}</Text>
    </>
  );

  if (colors.gradient) {
    return (
      <LinearGradient
        colors={colors.gradient as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[containerStyle, style]}
        testID={testID}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        { backgroundColor: colors.background },
        style,
      ]}
      testID={testID}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 4,
  },
});

export default Badge;
