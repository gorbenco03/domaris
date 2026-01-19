/**
 * IMOBI - Property Card Component
 * Premium property card for list and grid views
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
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

// ============================================
// TYPES
// ============================================

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
  image: string;
  isFavorite?: boolean;
  isNew?: boolean;
  isVerified?: boolean;
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
  image,
  isFavorite = false,
  isNew = false,
  isVerified = false,
  priceReduced = false,
  stats,
  onPress,
  onFavoritePress,
  variant = 'list',
}) => {
  const { theme } = useTheme();
  const heartScale = useRef(new Animated.Value(1)).current;

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

  const formatPrice = (value: number, curr: string) => {
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

  return (
    <Card
      onPress={onPress}
      style={[styles.card, variant === 'compact' && styles.compactCard]}
      testID={`property-card-${id}`}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Gradient overlay for price */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageOverlay}
        />

        {/* Badges */}
        <View style={styles.badgesContainer}>
          {isNew && (
            <Badge label="NOU" variant="new" size="sm" />
          )}
          {priceReduced && (
            <Badge label="REDUS" variant="warning" size="sm" />
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
          {characteristics.bedrooms && (
            <View style={styles.characteristic}>
              <Bed size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicText, { color: theme.colors.textSecondary }]}>
                {characteristics.bedrooms}
              </Text>
            </View>
          )}
          {characteristics.bathrooms && (
            <View style={styles.characteristic}>
              <Bath size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicText, { color: theme.colors.textSecondary }]}>
                {characteristics.bathrooms}
              </Text>
            </View>
          )}
          <View style={styles.characteristic}>
            <Maximize2 size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.characteristicText, { color: theme.colors.textSecondary }]}>
              {characteristics.totalArea} m²
            </Text>
          </View>
          {characteristics.floor && (
            <Text style={[styles.floorText, { color: theme.colors.textTertiary }]}>
              Etaj {characteristics.floor}/{characteristics.totalFloors}
            </Text>
          )}
        </View>

        {/* Footer with stats and verified badge */}
        <View style={styles.footer}>
          {isVerified && (
            <View style={styles.verifiedRow}>
              <CheckCircle size={14} color={theme.colors.accent.main} />
              <Text style={[styles.verifiedText, { color: theme.colors.accent.main }]}>
                Proprietar verificat
              </Text>
            </View>
          )}
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
  },
  compactCard: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: 12,
    marginBottom: 0,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
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
    backdropFilter: 'blur(10px)',
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
    borderTopColor: '#f1f5f9',
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
