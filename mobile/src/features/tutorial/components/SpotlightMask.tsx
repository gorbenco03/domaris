/**
 * RIVA - Spotlight Mask Component
 * Creates a dark overlay with a transparent "hole" for highlighting elements
 */

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ElementBounds } from '../types';
import { TUTORIAL_ANIMATION, TUTORIAL_OVERLAY } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpotlightMaskProps {
  targetBounds: ElementBounds | null;
  padding?: number;
  borderRadius?: number;
}

export const SpotlightMask: React.FC<SpotlightMaskProps> = ({
  targetBounds,
  padding = TUTORIAL_OVERLAY.SPOTLIGHT_PADDING,
  borderRadius = 16,
}) => {
  // Animated values for spotlight position
  const spotlightX = useSharedValue(SCREEN_WIDTH / 2);
  const spotlightY = useSharedValue(SCREEN_HEIGHT / 2);
  const spotlightWidth = useSharedValue(0);
  const spotlightHeight = useSharedValue(0);
  const spotlightRadius = useSharedValue(borderRadius);

  // Update spotlight position when target changes
  useEffect(() => {
    if (targetBounds) {
      const timingConfig = {
        duration: TUTORIAL_ANIMATION.SPOTLIGHT_MOVE_DURATION,
        easing: Easing.linear,
      };

      const paddedWidth = targetBounds.width + padding * 2;
      const paddedHeight = targetBounds.height + padding * 2;
      const nextRadius = borderRadius;

      spotlightX.value = withTiming(targetBounds.x - padding, timingConfig);
      spotlightY.value = withTiming(targetBounds.y - padding, timingConfig);
      spotlightWidth.value = withTiming(paddedWidth, timingConfig);
      spotlightHeight.value = withTiming(paddedHeight, timingConfig);
      spotlightRadius.value = withTiming(nextRadius, timingConfig);
    }
  }, [targetBounds, padding, borderRadius]);

  // NOTE: For iOS smoothness we animate ONLY transforms (translate/scale)
  // to avoid triggering layout recalculation every frame.
  const topOverlayStyle = useAnimatedStyle(() => {
    const y = Math.max(0, spotlightY.value);
    const scaleY = Math.max(0, Math.min(1, y / SCREEN_HEIGHT));
    const translateY = -((SCREEN_HEIGHT * (1 - scaleY)) / 2);
    return {
      transform: [{ translateY }, { scaleY }],
    };
  });

  const bottomOverlayStyle = useAnimatedStyle(() => {
    const y = Math.max(0, spotlightY.value);
    const h = Math.max(0, spotlightHeight.value);
    const top = Math.min(SCREEN_HEIGHT, y + h);
    const height = Math.max(0, SCREEN_HEIGHT - top);
    const scaleY = Math.max(0, Math.min(1, height / SCREEN_HEIGHT));
    const translateY = top - ((SCREEN_HEIGHT * (1 - scaleY)) / 2);
    return {
      transform: [{ translateY }, { scaleY }],
    };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    const x = Math.max(0, spotlightX.value);
    const y = Math.max(0, spotlightY.value);
    const h = Math.max(0, spotlightHeight.value);
    const scaleX = Math.max(0, Math.min(1, x / SCREEN_WIDTH));
    const scaleY = Math.max(0, Math.min(1, h / SCREEN_HEIGHT));
    const translateX = -((SCREEN_WIDTH * (1 - scaleX)) / 2);
    const translateY = y - ((SCREEN_HEIGHT * (1 - scaleY)) / 2);
    return {
      transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
    };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    const x = Math.max(0, spotlightX.value);
    const y = Math.max(0, spotlightY.value);
    const w = Math.max(0, spotlightWidth.value);
    const h = Math.max(0, spotlightHeight.value);
    const left = Math.min(SCREEN_WIDTH, x + w);
    const width = Math.max(0, SCREEN_WIDTH - left);
    const scaleX = Math.max(0, Math.min(1, width / SCREEN_WIDTH));
    const scaleY = Math.max(0, Math.min(1, h / SCREEN_HEIGHT));
    const translateX = left - ((SCREEN_WIDTH * (1 - scaleX)) / 2);
    const translateY = y - ((SCREEN_HEIGHT * (1 - scaleY)) / 2);
    return {
      transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
    };
  });

  const backdropColor = `rgba(0, 0, 0, ${TUTORIAL_OVERLAY.BACKDROP_OPACITY})`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[styles.overlayFull, { backgroundColor: backdropColor }, topOverlayStyle]}
      />
      <Animated.View
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[styles.overlayFull, { backgroundColor: backdropColor }, leftOverlayStyle]}
      />
      <Animated.View
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[styles.overlayFull, { backgroundColor: backdropColor }, rightOverlayStyle]}
      />
      <Animated.View
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[styles.overlayFull, { backgroundColor: backdropColor }, bottomOverlayStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayFull: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default SpotlightMask;
