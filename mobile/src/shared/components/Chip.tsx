/**
 * IMOBI - Chip Component
 * Filter chips and selection tags
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  hasDropdown?: boolean;
  variant?: 'default' | 'filter' | 'removable';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  hasDropdown = false,
  variant = 'default',
  size = 'md',
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = {
    sm: {
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[1],
      fontSize: theme.typography.fontSize.xs,
      iconSize: 14,
    },
    md: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      fontSize: theme.typography.fontSize.sm,
      iconSize: 16,
    },
  };

  const currentSize = sizeStyles[size];

  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: currentSize.paddingHorizontal,
      paddingVertical: currentSize.paddingVertical,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1.5,
    };

    if (selected) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    };
  };

  const getTextStyle = (): TextStyle => ({
    fontSize: currentSize.fontSize,
    fontFamily: selected ? 'Inter-SemiBold' : 'Inter-Medium',
    color: selected ? '#ffffff' : theme.colors.textPrimary,
    marginLeft: icon ? 6 : 0,
  });

  const iconColor = selected ? '#ffffff' : theme.colors.textSecondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      testID={testID}
    >
      <Animated.View style={[getChipStyle(), { transform: [{ scale }] }, style]}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        {variant === 'filter' && selected && (
          <Check size={currentSize.iconSize} color={iconColor} strokeWidth={2.5} />
        )}
        <Text style={getTextStyle()}>{label}</Text>
        {hasDropdown && (
          <ChevronDown 
            size={currentSize.iconSize} 
            color={iconColor} 
            style={styles.dropdownIcon}
          />
        )}
        {variant === 'removable' && onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <X size={currentSize.iconSize} color={iconColor} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    marginRight: 4,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  removeButton: {
    marginLeft: 4,
    padding: 2,
  },
});

export default Chip;
