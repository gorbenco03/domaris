/**
 * RIVA - Property Preview Card
 * Airbnb-style bottom sheet preview for map markers
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Heart, MapPin, Maximize2, X } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PropertyPreviewCardProps {
  id: number;
  title: string;
  price: number;
  currency?: string;
  city: string;
  neighborhood?: string;
  surface: number;
  rooms?: number;
  transactionType: string;
  imageUrl?: string;
  onPress: () => void;
  onClose: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export const PropertyPreviewCard: React.FC<PropertyPreviewCardProps> = ({
  title,
  price,
  currency = 'EUR',
  city,
  neighborhood,
  surface,
  rooms,
  transactionType,
  imageUrl,
  onPress,
  onClose,
  onFavoritePress,
  isFavorite = false,
}) => {
  const { theme } = useTheme();

  const formatPrice = () => {
    const formatted = price?.toLocaleString('ro-RO') || '0';
    const symbol = currency === 'EUR' ? '€' : 'RON';
    const suffix = transactionType === 'RENT' ? '/lună' : '';
    return `${formatted} ${symbol}${suffix}`;
  };

  const formatLocation = () => {
    if (neighborhood) {
      return `${neighborhood}, ${city}`;
    }
    return city || 'Locație necunoscută';
  };

  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: theme.colors.primary.main }]}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <X size={18} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {/* Image */}
        <Image
          source={{ uri: imageUrl || placeholderImage }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.price, { color: theme.colors.textPrimary }]}>
            {formatPrice()}
          </Text>

          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
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

          <View style={styles.detailsRow}>
            {rooms && rooms > 0 && (
              <Text style={[styles.detailText, { color: theme.colors.textTertiary }]}>
                {rooms} {rooms === 1 ? 'cameră' : 'camere'}
              </Text>
            )}
            {surface > 0 && (
              <View style={styles.detailItem}>
                <Maximize2 size={12} color={theme.colors.textTertiary} />
                <Text style={[styles.detailText, { color: theme.colors.textTertiary }]}>
                  {surface} m²
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Favorite button */}
        {onFavoritePress && (
          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: theme.colors.background }]}
            onPress={onFavoritePress}
            activeOpacity={0.8}
          >
            <Heart
              size={20}
              color={isFavorite ? theme.colors.secondary.error : theme.colors.textSecondary}
              fill={isFavorite ? theme.colors.secondary.error : 'none'}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  price: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
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
});

export default PropertyPreviewCard;
