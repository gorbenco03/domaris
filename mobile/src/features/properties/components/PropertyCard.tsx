/**
 * RIVA - Property Card Component
 * Premium property card with swipeable image carousel
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Eye,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { getEarlyAccessBadgeLabel, isEarlyAccessStatus } from '@/shared/utils';

// ============================================
// TYPES
// ============================================

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';

interface PropertyCardProps {
  id: string;
  title: string;
  transactionType: 'SALE' | 'RENT';
  price: number;
  currency: 'EUR' | 'RON';
  location: {
    neighborhood?: string;
    city: string;
  };
  characteristics: {
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    totalArea: number;
    floor?: number;
    totalFloors?: number;
  };
  images?: string[];
  /** @deprecated Use `images` array instead */
  image?: string;
  isFavorite?: boolean;
  isNew?: boolean;
  isVerified?: boolean;
  ownershipStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  listingStatus?: string;
  publicFrom?: string | Date;
  priceReduced?: boolean;
  stats?: {
    views: number;
    favorites: number;
  };
  onPress: () => void;
  onFavoritePress?: () => void;
  variant?: 'list' | 'compact';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// COMPONENT
// ============================================

export const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  title,
  transactionType,
  price,
  currency,
  location,
  characteristics,
  images: imagesProp,
  image: singleImage,
  isFavorite = false,
  isNew = false,
  isVerified = false,
  ownershipStatus,
  listingStatus,
  publicFrom,
  priceReduced = false,
  stats,
  onPress,
  onFavoritePress,
  variant = 'list',
}) => {
  const { theme } = useTheme();
  const heartScale = useRef(new Animated.Value(1)).current;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const hasEarlyAccessCountdown = isEarlyAccessStatus(listingStatus) && !!publicFrom;

  useEffect(() => {
    if (!hasEarlyAccessCountdown) return;

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => clearInterval(intervalId);
  }, [hasEarlyAccessCountdown]);

  // Resolve images: prefer array, fall back to single image, then placeholder
  const resolvedImages = (imagesProp && imagesProp.length > 0)
    ? imagesProp
    : singleImage
      ? [singleImage]
      : [FALLBACK_IMAGE];

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    onFavoritePress?.();
  };

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (imageWidth <= 0) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
    setActiveImageIndex(index);
  }, [imageWidth]);

  const handleImageLayout = useCallback((e: any) => {
    setImageWidth(e.nativeEvent.layout.width);
  }, []);

  const formatPrice = (value: number | undefined, curr: string) => {
    if (typeof value !== 'number') {
      return '-';
    }
    if (curr === 'EUR') {
      return `${value.toLocaleString('ro-RO')} €`;
    }
    return `${value.toLocaleString('ro-RO')} RON`;
  };

  const formatLocation = () => {
    if (location.neighborhood) {
      return `${location.neighborhood}, ${location.city}`;
    }
    return location.city;
  };

  const renderImage = useCallback(({ item }: { item: string }) => (
    <Image
      source={{ uri: item }}
      style={[styles.image, imageWidth > 0 ? { width: imageWidth } : undefined]}
      contentFit="cover"
      cachePolicy="disk"
      transition={200}
    />
  ), [imageWidth]);

  const keyExtractor = useCallback((_: string, index: number) => `img-${index}`, []);
  const earlyAccessBadgeLabel = getEarlyAccessBadgeLabel(listingStatus, publicFrom, nowMs);

  return (
    <Card
      onPress={onPress}
      style={variant === 'compact' ? [styles.card, styles.compactCard] : styles.card}
      testID={`property-card-${id}`}
    >
      {/* Image Section */}
      <View style={styles.imageContainer} onLayout={handleImageLayout}>
        {resolvedImages.length === 1 ? (
          <Image
            source={{ uri: resolvedImages[0] }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
            transition={200}
          />
        ) : (
          <FlatList
            data={resolvedImages}
            renderItem={renderImage}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
            nestedScrollEnabled
          />
        )}

        {/* Gradient overlay for price */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageOverlay}
          pointerEvents="none"
        />

        {/* Dot Indicators */}
        {resolvedImages.length > 1 && (
          <View style={styles.dotsContainer} pointerEvents="none">
            {resolvedImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeImageIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Badges */}
        <View style={styles.badgesContainer}>
          {priceReduced && (
            <Badge label="REDUS" variant="warning" size="sm" />
          )}
          {earlyAccessBadgeLabel && (
            <Badge label={earlyAccessBadgeLabel} variant="new" size="sm" />
          )}
        </View>

        {/* Price Badge */}
        <View style={styles.priceContainer}>
          <View style={[styles.priceBadge, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
            <Text style={[styles.priceText, { color: theme.colors.primary.main }]}>
              {formatPrice(price, currency)}
            </Text>
            {transactionType === 'RENT' && (
              <Text style={[styles.rentLabel, { color: theme.colors.textSecondary }]}>
                /lună
              </Text>
            )}
          </View>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity
          onPress={handleFavoritePress}
          style={[styles.favoriteButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Heart
              size={20}
              color={isFavorite ? theme.colors.secondary.error : theme.colors.textSecondary}
              fill={isFavorite ? theme.colors.secondary.error : 'none'}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={14} color={theme.colors.textSecondary} />
          <Text
            style={[styles.locationText, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {formatLocation()}
          </Text>
        </View>

        {/* Characteristics */}
        <View style={styles.characteristicsRow}>
          {(characteristics.rooms && characteristics.rooms > 0) && (
            <View style={styles.characteristic}>
              <Bed size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicText, { color: theme.colors.textSecondary }]}>
                {characteristics.rooms} {characteristics.rooms === 1 ? 'cameră' : 'camere'}
              </Text>
            </View>
          )}
          {(characteristics.bathrooms && characteristics.bathrooms > 0) && (
            <View style={styles.characteristic}>
              <Bath size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicText, { color: theme.colors.textSecondary }]}>
                {characteristics.bathrooms}
              </Text>
            </View>
          )}
          {(characteristics.totalArea && characteristics.totalArea > 0) && (
            <View style={styles.characteristic}>
              <Maximize2 size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicText, { color: theme.colors.textSecondary }]}>
                {characteristics.totalArea} m²
              </Text>
            </View>
          )}
          {(characteristics.floor !== undefined && characteristics.floor !== null) && (
            <Text style={[styles.floorText, { color: theme.colors.textTertiary }]}>
              {characteristics.totalFloors
                ? `Etaj ${characteristics.floor}/${characteristics.totalFloors}`
                : `Etaj ${characteristics.floor}`}
            </Text>
          )}
        </View>

        {/* Footer with stats and verified badge */}
        <View style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
          {(() => {
            const status = ownershipStatus || (isVerified ? 'verified' : 'none');
            if (status === 'verified') {
              return (
                <View style={styles.verifiedRow}>
                  <CheckCircle size={14} color={theme.colors.accent.main} />
                  <Text style={[styles.verifiedText, { color: theme.colors.accent.main }]}>
                    Proprietate verificată
                  </Text>
                </View>
              );
            }
            if (status === 'pending') {
              return (
                <View style={styles.verifiedRow}>
                  <CheckCircle size={14} color={theme.colors.secondary.warning} />
                  <Text style={[styles.verifiedText, { color: theme.colors.secondary.warning }]}>
                    Verificare în curs
                  </Text>
                </View>
              );
            }
            return (
              <View style={styles.verifiedRow}>
                <CheckCircle size={14} color={theme.colors.textTertiary} />
                <Text style={[styles.verifiedText, { color: theme.colors.textTertiary }]}>
                  Neverificată
                </Text>
              </View>
            );
          })()}
          {stats && (
            <View style={styles.statsRow}>
              <Eye size={12} color={theme.colors.textTertiary} />
              <Text style={[styles.statsText, { color: theme.colors.textTertiary }]}>
                {stats.views}
              </Text>
              <Heart size={12} color={theme.colors.textTertiary} style={styles.statsIcon} />
              <Text style={[styles.statsText, { color: theme.colors.textTertiary }]}>
                {stats.favorites}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    width: '100%',
    maxWidth: '100%',
  },
  compactCard: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: 12,
    marginBottom: 0,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  priceContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  rentLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
    flex: 1,
  },
  characteristicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  characteristic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  characteristicText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  floorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginLeft: 3,
  },
  statsIcon: {
    marginLeft: 10,
  },
});

export default PropertyCard;
