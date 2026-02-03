/**
 * RIVA - Keyboard Avoiding Wrapper
 * A consistent wrapper component that handles keyboard avoiding behavior
 * across all screens with input fields.
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollEnabled?: boolean;
  dismissOnTap?: boolean;
  keyboardVerticalOffset?: number;
}

const KeyboardAvoidingWrapper: React.FC<KeyboardAvoidingWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollEnabled = true,
  dismissOnTap = true,
  keyboardVerticalOffset,
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate offset based on platform and safe area
  const defaultOffset = Platform.OS === 'ios' ? insets.top + 10 : 0;
  const offset = keyboardVerticalOffset ?? defaultOffset;

  const content = scrollEnabled ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      horizontal={false}
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceHorizontal={false}
      directionalLockEnabled
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  const wrappedContent = dismissOnTap ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  ) : (
    content
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      {wrappedContent}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  },
});

export default KeyboardAvoidingWrapper;
