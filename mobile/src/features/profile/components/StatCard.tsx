/**
 * RIVA - Stat Card Component
 * Displays statistics with icon and value
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  style?: ViewStyle;
  horizontal?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  style,
  horizontal = false,
}) => {
  const { theme } = useTheme();

  if (horizontal) {
    return (
      <View
        style={[
          styles.horizontalContainer,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[3],
            ...theme.shadows.sm,
          },
          style,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${theme.colors.accent.main}15`,
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          {React.isValidElement(icon) 
            ? React.cloneElement(icon, {
                color: theme.colors.accent.main,
                size: 20,
              } as any)
            : icon}
        </View>
        <View style={styles.horizontalContent}>
          <Text
            style={[
              styles.value,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.lg,
              },
            ]}
          >
            {value}
          </Text>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.xs,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          ...theme.shadows.sm,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainerLarge,
          {
            backgroundColor: `${theme.colors.accent.main}15`,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        {React.isValidElement(icon) 
          ? React.cloneElement(icon, {
              color: theme.colors.accent.main,
              size: 24,
            } as any)
          : icon}
      </View>
      <Text
        style={[
          styles.valueLarge,
          {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.fontSize['2xl'],
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerLarge: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalContent: {
    flex: 1,
  },
  value: {
    fontWeight: '600',
  },
  valueLarge: {
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    textAlign: 'center',
  },
});

export default StatCard;
