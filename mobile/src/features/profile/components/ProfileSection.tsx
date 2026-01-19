/**
 * IMOBI - Profile Section Component
 * Groups related menu items with a title
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface ProfileSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  children,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.xs,
              marginBottom: theme.spacing[2],
              marginLeft: theme.spacing[4],
              marginTop: theme.spacing[4],
            },
          ]}
        >
          {title.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            overflow: 'hidden',
            ...theme.shadows.sm,
          },
        ]}
      >
        {React.Children.map(children, (child, index) => (
          <>
            {child}
            {index < React.Children.count(children) - 1 && (
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: theme.colors.divider,
                    marginLeft: 74, // icon width + padding
                  },
                ]}
              />
            )}
          </>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  title: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {},
  divider: {
    height: 1,
  },
});

export default ProfileSection;
