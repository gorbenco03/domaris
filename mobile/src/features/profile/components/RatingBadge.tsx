/**
 * RIVA - Rating Badge Component
 * Displays user rating with star icon
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Star, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface RatingBadgeProps {
  rating: number;
  reviewCount: number;
  onPress?: () => void;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  reviewCount,
  onPress,
  style,
  size = 'md',
}) => {
  const { theme } = useTheme();

  const isClickable = !!onPress;
  const Container = isClickable ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          padding: size === 'sm' ? theme.spacing[3] : theme.spacing[4],
          ...theme.shadows.sm,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.ratingContainer}>
          <Star
            size={size === 'sm' ? 18 : 22}
            color={theme.colors.secondary.warning}
            fill={theme.colors.secondary.warning}
          />
          <Text
            style={[
              styles.rating,
              {
                color: theme.colors.textPrimary,
                fontSize: size === 'sm' 
                  ? theme.typography.fontSize.lg 
                  : theme.typography.fontSize.xl,
                marginLeft: theme.spacing[2],
              },
            ]}
          >
            {rating.toFixed(1)}
          </Text>
        </View>
        <Text
          style={[
            styles.reviewCount,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
        >
          ({reviewCount} recenzii)
        </Text>
      </View>
      
      {isClickable && (
        <View style={styles.arrowContainer}>
          <Text
            style={[
              styles.viewText,
              {
                color: theme.colors.accent.main,
                fontSize: theme.typography.fontSize.sm,
                marginRight: 4,
              },
            ]}
          >
            Vezi
          </Text>
          <ChevronRight
            size={18}
            color={theme.colors.accent.main}
          />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontWeight: '700',
  },
  reviewCount: {
    marginLeft: 8,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontWeight: '600',
  },
});

export default RatingBadge;
