/**
 * IMOBI - Profile Menu Item Component
 * Reusable menu item for profile settings
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface ProfileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  danger?: boolean;
  style?: ViewStyle;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  icon,
  label,
  description,
  onPress,
  rightElement,
  showArrow = true,
  danger = false,
  style,
}) => {
  const { theme } = useTheme();

  const textColor = danger ? theme.colors.secondary.error : theme.colors.textPrimary;
  const iconColor = danger ? theme.colors.secondary.error : theme.colors.textSecondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          paddingVertical: theme.spacing[4],
          paddingHorizontal: theme.spacing[4],
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: danger 
              ? `${theme.colors.secondary.error}15` 
              : theme.colors.divider,
            borderRadius: theme.borderRadius.md,
            width: 44,
            height: 44,
          },
        ]}
      >
        {React.isValidElement(icon) 
          ? React.cloneElement(icon, {
              color: iconColor,
              size: 22,
            } as any)
          : icon}
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            {
              color: textColor,
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

      {rightElement ? (
        rightElement
      ) : showArrow ? (
        <ChevronRight
          size={22}
          color={theme.colors.textTertiary}
        />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontWeight: '500',
  },
  description: {
    marginTop: 2,
  },
});

export default ProfileMenuItem;
