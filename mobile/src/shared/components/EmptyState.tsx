/**
 * IMOBI - Empty State Component
 * Displays a centered empty state with icon, title, message, and optional action
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            fontFamily: 'Inter-SemiBold',
          },
        ]}
      >
        {title}
      </Text>
      
      {message && (
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.textSecondary,
              fontFamily: 'Inter-Regular',
            },
          ]}
        >
          {message}
        </Text>
      )}
      
      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionsContainer}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              style={styles.primaryButton}
            />
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              variant="secondary"
              onPress={onSecondaryAction}
              style={styles.secondaryButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 20,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    minWidth: 180,
  },
  secondaryButton: {
    minWidth: 180,
  },
});

export default EmptyState;
