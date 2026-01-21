/**
 * IMOBI - Spotlight Mask Component
 * Creates a dark overlay with a transparent "hole" for highlighting elements
 */

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { ElementBounds } from '../types';
import { TUTORIAL_ANIMATION, TUTORIAL_OVERLAY } from '../constants';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

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
        easing: Easing.out(Easing.cubic),
      };

      spotlightX.value = withTiming(targetBounds.x - padding, timingConfig);
      spotlightY.value = withTiming(targetBounds.y - padding, timingConfig);
      spotlightWidth.value = withTiming(targetBounds.width + padding * 2, timingConfig);
      spotlightHeight.value = withTiming(targetBounds.height + padding * 2, timingConfig);
      spotlightRadius.value = withTiming(borderRadius, timingConfig);
    }
  }, [targetBounds, padding, borderRadius]);

  // Animated props for the spotlight hole
  const animatedHoleProps = useAnimatedProps(() => ({
    x: spotlightX.value,
    y: spotlightY.value,
    width: spotlightWidth.value,
    height: spotlightHeight.value,
    rx: spotlightRadius.value,
    ry: spotlightRadius.value,
  }));

  return (
    <Svg
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <Mask id="spotlight-mask">
          {/* White background = visible area */}
          <Rect
            x="0"
            y="0"
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fill="white"
          />
          {/* Black hole = transparent area */}
          <AnimatedRect
            fill="black"
            animatedProps={animatedHoleProps}
          />
        </Mask>
      </Defs>

      {/* Dark overlay with mask applied */}
      <Rect
        x="0"
        y="0"
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        fill={`rgba(0, 0, 0, ${TUTORIAL_OVERLAY.BACKDROP_OPACITY})`}
        mask="url(#spotlight-mask)"
      />
    </Svg>
  );
};

export default SpotlightMask;
