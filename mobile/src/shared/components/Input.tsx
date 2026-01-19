import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  secureTextEntry,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const getBorderColor = () => {
    if (error) return theme.colors.secondary.error;
    if (isFocused) return theme.colors.accent.main;
    return theme.colors.border;
  };

  const isPassword = secureTextEntry !== undefined;

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.xs,
              marginBottom: theme.spacing[1],
            },
          ]}
        >
          {label}
        </Text>
      )}
      <Pressable
        onPress={handlePress}
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            height: theme.componentSizes.input.height,
          },
          isFocused && {
            shadowColor: error
              ? theme.colors.secondary.error
              : theme.colors.accent.main,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 2,
            paddingHorizontal: 15, // Un punct mai puțin pentru a compensa border-ul mai gros
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...props}
          ref={inputRef}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.base,
            },
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={isPassword && !isPasswordVisible}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={theme.colors.textTertiary} />
            ) : (
              <Eye size={20} color={theme.colors.textTertiary} />
            )}
          </TouchableOpacity>
        )}
        {!isPassword && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </Pressable>
      {error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.secondary.error,
              fontSize: theme.typography.fontSize.xs,
              marginTop: theme.spacing[1],
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%', // Acum e sigur pentru că părintele are înălțime fixă (52)
    paddingVertical: 0,
    margin: 0,
    minWidth: 50,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  error: {},
});

export default Input;
