/**
 * IMOBI - Skeleton Loading Component
 * Animated placeholder for loading states
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Dimensions } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Basic Skeleton element with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton for Property Cards
 */
export const PropertyCardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.propertyCard,
        { backgroundColor: theme.colors.surface, borderRadius: 16 },
        style,
      ]}
    >
      {/* Image placeholder */}
      <Skeleton width="100%" height={180} borderRadius={16} />

      <View style={styles.propertyContent}>
        {/* Price */}
        <Skeleton width={120} height={24} borderRadius={6} />

        {/* Title */}
        <Skeleton width="90%" height={18} borderRadius={4} style={{ marginTop: 12 }} />

        {/* Location */}
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 8 }} />

        {/* Features row */}
        <View style={styles.featuresRow}>
          <Skeleton width={60} height={14} borderRadius={4} />
          <Skeleton width={60} height={14} borderRadius={4} />
          <Skeleton width={60} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton for Conversation Items
 */
export const ConversationSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.conversationItem,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
    >
      {/* Avatar */}
      <Skeleton width={56} height={56} borderRadius={28} />

      <View style={styles.conversationContent}>
        {/* Name */}
        <Skeleton width={140} height={16} borderRadius={4} />

        {/* Message preview */}
        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 6 }} />

        {/* Property info */}
        <Skeleton width={100} height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>

      {/* Time */}
      <Skeleton width={40} height={12} borderRadius={4} />
    </View>
  );
};

/**
 * Skeleton for Notification Items
 */
export const NotificationSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.notificationItem,
        { backgroundColor: theme.colors.surface },
        style,
      ]}
    >
      {/* Icon */}
      <Skeleton width={44} height={44} borderRadius={12} />

      <View style={styles.notificationContent}>
        {/* Title */}
        <Skeleton width="70%" height={16} borderRadius={4} />

        {/* Description */}
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginTop: 6 }} />

        {/* Time */}
        <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
};

/**
 * Skeleton for Viewing Cards
 */
export const ViewingCardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.viewingCard,
        { backgroundColor: theme.colors.surface, borderRadius: 16 },
        style,
      ]}
    >
      <View style={styles.viewingHeader}>
        {/* Date badge */}
        <Skeleton width={60} height={60} borderRadius={12} />

        <View style={styles.viewingInfo}>
          {/* Property title */}
          <Skeleton width="80%" height={16} borderRadius={4} />

          {/* Time */}
          <Skeleton width={100} height={14} borderRadius={4} style={{ marginTop: 6 }} />

          {/* Status */}
          <Skeleton width={80} height={20} borderRadius={10} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton for Profile Stats
 */
export const StatsSkeleton: React.FC = () => {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Skeleton width={40} height={28} borderRadius={6} />
        <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={40} height={28} borderRadius={6} />
        <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={40} height={28} borderRadius={6} />
        <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
};

/**
 * Generic list skeleton loader
 */
interface SkeletonListProps {
  count?: number;
  type: 'property' | 'conversation' | 'notification' | 'viewing';
  style?: ViewStyle;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  type,
  style,
}) => {
  const components = {
    property: PropertyCardSkeleton,
    conversation: ConversationSkeleton,
    notification: NotificationSkeleton,
    viewing: ViewingCardSkeleton,
  };

  const Component = components[type];

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} style={{ marginBottom: 16 }} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  propertyCard: {
    overflow: 'hidden',
  },
  propertyContent: {
    padding: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  conversationContent: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  notificationContent: {
    flex: 1,
  },
  viewingCard: {
    padding: 16,
  },
  viewingHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  viewingInfo: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
});

export default Skeleton;
