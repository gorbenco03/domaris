import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Camera, Send, Smile, Paperclip, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

export interface ChatInputRef {
  setMessage: (text: string) => void;
  focus: () => void;
  clear: () => void;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttachPress?: () => void;
  onCameraPress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

// ============================================
// COMPONENT
// ============================================

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  onSend,
  onAttachPress,
  onCameraPress,
  placeholder = 'Scrie un mesaj...',
  disabled = false,
  maxLength = 2000,
}, ref) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  useImperativeHandle(ref, () => ({
    setMessage: (text: string) => setMessage(text),
    focus: () => inputRef.current?.focus(),
    clear: () => setMessage(''),
  }));

  const canSend = message.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSend(message.trim());
    setMessage('');
  };

  const handleChangeText = (text: string) => {
    if (text.length <= maxLength) {
      setMessage(text);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius['2xl'],
              borderColor: isFocused ? theme.colors.primary.light : 'transparent',
              borderWidth: isFocused ? 1 : 0,
            },
          ]}
        >
          {/* Attachment button */}
          {onAttachPress && (
            <TouchableOpacity
              onPress={onAttachPress}
              style={styles.iconButton}
              disabled={disabled}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Paperclip
                size={22}
                color={disabled ? theme.colors.textTertiary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {/* Camera button */}
          {onCameraPress && (
            <TouchableOpacity
              onPress={onCameraPress}
              style={styles.iconButton}
              disabled={disabled}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Camera
                size={22}
                color={disabled ? theme.colors.textTertiary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.base,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            value={message}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={maxLength}
            returnKeyType="default"
            blurOnSubmit={false}
            editable={!disabled}
          />

          {/* Send button */}
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              style={[
                styles.sendButton,
                {
                  backgroundColor: canSend
                    ? theme.colors.accent.main
                    : theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Send
                size={18}
                color={canSend ? '#ffffff' : theme.colors.textTertiary}
                style={{ marginLeft: 2, marginTop: -1 }}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    padding: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 44,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

export default ChatInput;
