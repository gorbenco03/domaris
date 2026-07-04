/**
 * Enhanced Property Card for AI Chat
 * Shows property info with image, schedule viewing and contact buttons
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { MapPin, Maximize, BedDouble, Calendar, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

interface AiPropertyCardProps {
  property: {
    id: number;
    title: string;
    city: string;
    neighborhood?: string;
    priceEur: number;
    transactionType: string;
    rooms: number;
    surfaceSqm: number;
    imageUrl?: string;
    matchScore?: number;
    matchReasons?: string[];
  };
  onView: (propertyId: number) => void;
  onSchedule: (propertyId: number, title: string) => void;
  onContact: (propertyId: number, title: string) => void;
}

const AiPropertyCard: React.FC<AiPropertyCardProps> = ({
  property,
  onView,
  onSchedule,
  onContact,
}) => {
  const { theme } = useTheme();

  const location = [property.neighborhood, property.city]
    .filter(Boolean)
    .join(', ');

  const priceLabel =
    property.transactionType === 'RENT'
      ? `${property.priceEur.toLocaleString('ro-RO')} \u20AC/lun\u0103`
      : `${property.priceEur.toLocaleString('ro-RO')} \u20AC`;

  const scoreLabel = property.matchScore !== undefined
    ? `${Math.max(1, Math.min(10, Math.round(property.matchScore / 10)))}/10`
    : undefined;

  const reasons = Array.isArray(property.matchReasons)
    ? property.matchReasons.slice(0, 3)
    : [];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onView(property.id)}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.lg,
        },
      ]}
    >
      {/* Image */}
      <View>
        {property.imageUrl ? (
          <Image
            source={{ uri: property.imageUrl }}
            style={[styles.image, { borderTopLeftRadius: theme.borderRadius.lg, borderTopRightRadius: theme.borderRadius.lg }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              {
                backgroundColor: theme.colors.border,
                borderTopLeftRadius: theme.borderRadius.lg,
                borderTopRightRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <BedDouble size={24} color={theme.colors.textTertiary} />
          </View>
        )}
        {scoreLabel && (
          <View
            style={[
              styles.scoreBadge,
              {
                backgroundColor: theme.colors.primary.main,
              },
            ]}
          >
            <Text
              style={[
                styles.scoreText,
                { color: '#ffffff', fontSize: theme.typography.fontSize.xs },
              ]}
            >
              {scoreLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
          numberOfLines={1}
        >
          {property.title}
        </Text>

        {/* Location */}
        <View style={styles.row}>
          <MapPin size={12} color={theme.colors.textTertiary} />
          <Text
            style={[
              styles.detail,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.xs,
              },
            ]}
            numberOfLines={1}
          >
            {location || 'Locatie'}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.row}>
            <BedDouble size={12} color={theme.colors.textTertiary} />
            <Text
              style={[
                styles.detail,
                { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs },
              ]}
            >
              {property.rooms} cam.
            </Text>
          </View>
          <View style={styles.row}>
            <Maximize size={12} color={theme.colors.textTertiary} />
            <Text
              style={[
                styles.detail,
                { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs },
              ]}
            >
              {property.surfaceSqm} mp
            </Text>
          </View>
        </View>

        {reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            {reasons.map((reason) => (
              <View
                key={reason}
                style={[
                  styles.reasonChip,
                  {
                    backgroundColor: theme.colors.primary.main + '10',
                    borderColor: theme.colors.primary.main + '20',
                    borderRadius: theme.borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.reasonText,
                    {
                      color: theme.colors.primary.main,
                      fontSize: theme.typography.fontSize.xs,
                    },
                  ]}
                >
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Price */}
        <Text
          style={[
            styles.price,
            {
              color: theme.colors.accent.main,
              fontSize: theme.typography.fontSize.base,
            },
          ]}
        >
          {priceLabel}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                flex: 1,
              },
            ]}
            onPress={(e) => { e.stopPropagation(); onSchedule(property.id, property.title); }}
          >
            <Calendar size={13} color={theme.colors.primary.main} />
            <Text style={[styles.actionText, { color: theme.colors.primary.main, fontSize: theme.typography.fontSize.xs }]}>
              Programează vizionare
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.colors.primary.main,
                borderColor: theme.colors.primary.main,
                flex: 1,
              },
            ]}
            onPress={(e) => { e.stopPropagation(); onContact(property.id, property.title); }}
          >
            <MessageCircle size={13} color="#ffffff" />
            <Text style={[styles.actionText, { color: '#ffffff', fontSize: theme.typography.fontSize.xs }]}>
              Contactează
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
  },
  imagePlaceholder: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scoreText: {
    fontWeight: '700',
  },
  content: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detail: {},
  features: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  reasonChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reasonText: {
    fontWeight: '500',
  },
  price: {
    fontWeight: '700',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontWeight: '500',
  },
});

export default AiPropertyCard;
