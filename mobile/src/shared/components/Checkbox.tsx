/**
 * RIVA - Checkbox Component
 * Styled checkbox with optional label
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  error?: boolean;
  containerStyle?: ViewStyle;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  error = false,
  containerStyle,
}) => {
  const { theme } = useTheme();

  const getBorderColor = () => {
    if (error) return theme.colors.secondary.error;
    if (checked) return theme.colors.accent.main;
    return theme.colors.border;
  };

  const getBackgroundColor = () => {
    if (checked) return theme.colors.accent.main;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled, containerStyle]}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
            borderRadius: theme.borderRadius.sm,
          },
        ]}
      >
        {checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
      </View>
      {label && (
        <View style={styles.labelContainer}>
          {typeof label === 'string' ? (
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
          ) : (
            label
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  labelContainer: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    lineHeight: 22,
  },
});

export default Checkbox;
