/**
 * RIVA - ScrollView Style Helpers
 * Standard styles for preventing horizontal scroll on mobile screens
 */

import { StyleSheet, ViewStyle } from 'react-native';

/**
 * Default style for ScrollView container
 * Prevents horizontal scroll by ensuring flex: 1
 */
export const defaultScrollViewStyle: ViewStyle = {
  flex: 1,
};

/**
 * Default contentContainerStyle for vertical ScrollView
 * Ensures content doesn't exceed screen width
 */
export const defaultScrollContentStyle: ViewStyle = {
  width: '100%',
  flexGrow: 1,
  paddingBottom: 32,
};

/**
 * Helper function to create contentContainerStyle with custom padding
 */
export const createScrollContentStyle = (paddingBottom: number = 32): ViewStyle => ({
  width: '100%',
  flexGrow: 1,
  paddingBottom,
});

/**
 * Standard pattern for vertical ScrollView props
 */
export const verticalScrollViewProps = {
  horizontal: false as const,
  showsVerticalScrollIndicator: false,
  contentContainerStyle: defaultScrollContentStyle,
};
