/**
 * RIVA - Icon Button Component
 * Circular icon button with various styles
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

type IconButtonVariant = 'solid' | 'outlined' | 'ghost' | 'surface';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'ghost',
  size = 'md',
  color,
  disabled = false,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const sizeValues: Record<IconButtonSize, number> = {
    sm: 32,
    md: 44,
    lg: 52,
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
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

  const getVariantStyle = (): ViewStyle => {
    const buttonColor = color || theme.colors.primary.main;
    
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: buttonColor,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: buttonColor,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'surface':
        return {
          backgroundColor: theme.colors.surface,
          ...theme.shadows.sm,
        };
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.container,
          getVariantStyle(),
          {
            width: sizeValues[size],
            height: sizeValues[size],
            borderRadius: sizeValues[size] / 2,
            opacity: disabled ? 0.5 : 1,
          },
          { transform: [{ scale }] },
          style,
        ]}
      >
        {icon}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IconButton;
