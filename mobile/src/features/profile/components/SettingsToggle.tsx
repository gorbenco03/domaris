/**
 * RIVA - Settings Toggle Component
 * Toggle switch for settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface SettingsToggleProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          paddingVertical: theme.spacing[4],
          paddingHorizontal: theme.spacing[4],
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.divider,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      >
        {React.isValidElement(icon) 
          ? React.cloneElement(icon, {
              color: theme.colors.textSecondary,
              size: 22,
            } as any)
          : icon}
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.base,
            },
          ]}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.accent.light,
        }}
        thumbColor={Platform.OS === 'ios' ? undefined : value ? theme.colors.accent.main : '#f4f3f4'}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontWeight: '500',
  },
  description: {
    marginTop: 2,
  },
});

export default SettingsToggle;
