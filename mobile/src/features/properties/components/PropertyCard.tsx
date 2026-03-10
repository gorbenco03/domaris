/**
 * RIVA - Property Card Component
 * Premium property card with swipeable image carousel
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
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
import { Badge } from '@/shared/components/Badge';
import { getEarlyAccessBadgeLabel, isEarlyAccessStatus } from '@/shared/utils';

// ============================================
// TYPES
// ============================================

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';

let sharedNowMs = Date.now();
let sharedNowInterval: ReturnType<typeof setInterval> | null = null;
const sharedNowSubscribers = new Set<(nowMs: number) => void>();

const ensureSharedNowTicker = () => {
  if (sharedNowInterval) return;

  sharedNowInterval = setInterval(() => {
    sharedNowMs = Date.now();
    for (const notify of sharedNowSubscribers) {
      notify(sharedNowMs);
    }
  }, 30_000);
};

const cleanupSharedNowTicker = () => {
  if (sharedNowSubscribers.size > 0 || !sharedNowInterval) return;
  clearInterval(sharedNowInterval);
  sharedNowInterval = null;
};

const subscribeSharedNow = (notify: (nowMs: number) => void) => {
  sharedNowSubscribers.add(notify);
  notify(sharedNowMs);
  ensureSharedNowTicker();

  return () => {
    sharedNowSubscribers.delete(notify);
    cleanupSharedNowTicker();
  };
};

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
  isPromoted?: boolean;
  promotionBadgeText?: string;
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
  isPromoted = false,
  promotionBadgeText,
  stats,
  onPress,
  onFavoritePress,
  variant = 'list',
}) => {
  const { theme } = useTheme();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const hasEarlyAccessCountdown = isEarlyAccessStatus(listingStatus) && !!publicFrom;

  useEffect(() => {
    if (!hasEarlyAccessCountdown) return;
    return subscribeSharedNow(setNowMs);
  }, [hasEarlyAccessCountdown]);

  const resolvedImages = (imagesProp && imagesProp.length > 0)
    ? imagesProp
    : singleImage ? [singleImage] : [FALLBACK_IMAGE];
  const imageCount = resolvedImages.length;

  // Track current image index via ref only — no state update during scroll
  const currentIndexRef = useRef(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const containerWidthRef = useRef(0);

  const handleImageLayout = useCallback((e: any) => {
    containerWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const w = containerWidthRef.current;
    if (w <= 0) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / w);
    if (idx !== currentIndexRef.current) {
      currentIndexRef.current = idx;
      setDisplayIndex(idx);
    }
  }, []);

  const earlyAccessBadgeLabel = getEarlyAccessBadgeLabel(listingStatus, publicFrom, nowMs);
  const locationText = location.neighborhood
    ? `${location.neighborhood}, ${location.city}`
    : location.city;
  const priceText = typeof price !== 'number'
    ? '-'
    : currency === 'EUR'
      ? `${price.toLocaleString('ro-RO')} €`
      : `${price.toLocaleString('ro-RO')} RON`;

  const cardStyle = variant === 'compact'
    ? [styles.card, styles.compactCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, ...theme.shadows.card }]
    : [styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, ...theme.shadows.card }];

  const verificationStatus = ownershipStatus || (isVerified ? 'verified' : 'none');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={cardStyle}
      testID={`property-card-${id}`}
    >
      {/* Image Section */}
      <View style={styles.imageContainer} onLayout={handleImageLayout}>
        {imageCount === 1 ? (
          <Image
            source={{ uri: resolvedImages[0] }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
            recyclingKey={`img-${id}-0`}
          />
        ) : (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={0}
            bounces={false}
            decelerationRate="fast"
          >
            {resolvedImages.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={[styles.image, { width: containerWidthRef.current || SCREEN_WIDTH }]}
                contentFit="cover"
                cachePolicy="disk"
                recyclingKey={`img-${id}-${i}`}
              />
            ))}
          </ScrollView>
        )}

        {/* Gradient overlay */}
        <View style={styles.imageOverlay} pointerEvents="none" />

        {/* Image count indicator — bottom right */}
        {imageCount > 1 && (
          <View style={styles.imageCountBadge} pointerEvents="none">
            <Text style={styles.imageCountText}>{displayIndex + 1}/{imageCount}</Text>
          </View>
        )}

        {/* Badges */}
        <View style={styles.badgesContainer}>
          {isPromoted && promotionBadgeText && (
            <Badge
              label={promotionBadgeText}
              variant={
                promotionBadgeText === 'Evidențiat'
                  ? 'premium'
                  : promotionBadgeText === 'Prima pagină'
                  ? 'accent'
                  : 'info'
              }
              size="sm"
            />
          )}
          {priceReduced && (
            <Badge label="REDUS" variant="warning" size="sm" />
          )}
          {earlyAccessBadgeLabel && (
            <Badge label={earlyAccessBadgeLabel} variant="new" size="sm" />
          )}
        </View>

        {/* Price Badge */}
        <View style={styles.priceContainer}>
          <View style={styles.priceBadge}>
            <Text style={[styles.priceText, { color: theme.colors.primary.main }]}>
              {priceText}
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
          onPress={onFavoritePress}
          style={styles.favoriteButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={20}
            color={isFavorite ? theme.colors.secondary.error : theme.colors.textSecondary}
            fill={isFavorite ? theme.colors.secondary.error : 'none'}
          />
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
            {locationText}
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

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
          <View style={styles.verifiedRow}>
            <CheckCircle
              size={14}
              color={
                verificationStatus === 'verified' ? theme.colors.accent.main
                : verificationStatus === 'pending' ? theme.colors.secondary.warning
                : theme.colors.textTertiary
              }
            />
            <Text style={[styles.verifiedText, {
              color: verificationStatus === 'verified' ? theme.colors.accent.main
                : verificationStatus === 'pending' ? theme.colors.secondary.warning
                : theme.colors.textTertiary
            }]}>
              {verificationStatus === 'verified' ? 'Proprietate verificată'
                : verificationStatus === 'pending' ? 'Verificare în curs'
                : 'Neverificată'}
            </Text>
          </View>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  imageCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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

export default React.memo(PropertyCard);
