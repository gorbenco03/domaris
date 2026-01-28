/**
 * RIVA - OTP Input Component
 * Input for one-time passwords (6 digits)
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  containerStyle?: ViewStyle;
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
      Keyboard.dismiss();
    }
  }, [value, length, onComplete]);

  const handleChange = (text: string, index: number) => {
    // Allow only numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    
    if (cleaned.length > 1) {
      // Paste handling
      const pastedValue = cleaned.slice(0, length);
      onChange(pastedValue);
      inputRefs.current[Math.min(pastedValue.length, length - 1)]?.focus();
      return;
    }

    const newValue = value.split('');
    newValue[index] = cleaned;
    const result = newValue.join('').slice(0, length);
    onChange(result);

    // Move to next input
    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input and clear it
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    }
  };

  const getBorderColor = (index: number) => {
    if (error) return theme.colors.secondary.error;
    if (focusedIndex === index) return theme.colors.accent.main;
    if (value[index]) return theme.colors.primary.main;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          style={[
            styles.input,
            {
              borderColor: getBorderColor(index),
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize['2xl'],
              borderRadius: theme.borderRadius.lg,
            },
            focusedIndex === index && {
              shadowColor: error
                ? theme.colors.secondary.error
                : theme.colors.accent.main,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(nativeEvent.key, index)
          }
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  input: {
    width: 48,
    height: 56,
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 2,
  },
});

export default OTPInput;
