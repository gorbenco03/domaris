/**
 * RIVA - Amenity Selector Component
 * Multi-select amenities/features grid — folosește lista partajată din @domaris/types
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Wind,
  Flame,
  ThermometerSun,
  Thermometer,
  ArrowUp,
  Sofa,
  Utensils,
  WashingMachine,
  Droplets,
  Square,
  TreePine,
  Waves,
  Dumbbell,
  Package,
  Shield,
  Video,
  Smartphone,
  Wifi,
  Tv,
  PawPrint,
  CarFront,
  Bell,
  Key,
  Sun,
  Zap,
  Layers,
} from 'lucide-react-native';
import {
  AMENITIES,
  AMENITY_CATEGORY_LABELS,
  type AmenityId,
  type AmenityCategory,
} from '@domaris/types';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

/** Alias pentru compatibilitate cu consumatorii existenți */
export type Amenity = AmenityId;

interface AmenitySelectorProps {
  selectedAmenities: Amenity[];
  onSelectionChange: (amenities: Amenity[]) => void;
}

// ============================================
// ICON MAP
// ============================================

const getIconNode = (id: AmenityId, color: string, size: number): React.ReactNode => {
  switch (id) {
    // Comfort
    case 'AIR_CONDITIONING':    return <Wind size={size} color={color} />;
    case 'CENTRAL_HEATING':     return <ThermometerSun size={size} color={color} />;
    case 'UNDERFLOOR_HEATING':  return <Thermometer size={size} color={color} />;
    case 'FIREPLACE':           return <Flame size={size} color={color} />;
    case 'ELEVATOR':            return <ArrowUp size={size} color={color} />;
    case 'FURNISHED':           return <Sofa size={size} color={color} />;
    case 'SEMI_FURNISHED':      return <Sofa size={size} color={color} />;
    case 'DOUBLE_GLAZING':      return <Square size={size} color={color} />;
    case 'THERMAL_INSULATION':  return <Layers size={size} color={color} />;
    // Appliances
    case 'KITCHEN_APPLIANCES':  return <Utensils size={size} color={color} />;
    case 'WASHER':              return <WashingMachine size={size} color={color} />;
    case 'DRYER':               return <Droplets size={size} color={color} />;
    case 'DISHWASHER':          return <Droplets size={size} color={color} />;
    // Outdoor
    case 'BALCONY':             return <Square size={size} color={color} />;
    case 'TERRACE':             return <Square size={size} color={color} />;
    case 'GARDEN':              return <TreePine size={size} color={color} />;
    case 'POOL':                return <Waves size={size} color={color} />;
    case 'SAUNA':               return <Flame size={size} color={color} />;
    case 'GYM':                 return <Dumbbell size={size} color={color} />;
    case 'STORAGE_ROOM':        return <Package size={size} color={color} />;
    case 'UNDERGROUND_PARKING': return <CarFront size={size} color={color} />;
    // Security
    case 'SECURITY_SYSTEM':     return <Shield size={size} color={color} />;
    case 'VIDEO_INTERCOM':      return <Video size={size} color={color} />;
    case 'INTERCOM':            return <Bell size={size} color={color} />;
    case 'CONCIERGE':           return <Key size={size} color={color} />;
    // Tech
    case 'SMART_HOME':          return <Smartphone size={size} color={color} />;
    case 'FIBER_INTERNET':      return <Wifi size={size} color={color} />;
    case 'CABLE_TV':            return <Tv size={size} color={color} />;
    case 'PET_FRIENDLY':        return <PawPrint size={size} color={color} />;
    // Utilities
    case 'CENTRAL_GAS':         return <Flame size={size} color={color} />;
    case 'SOLAR_PANELS':        return <Sun size={size} color={color} />;
    case 'GENERATOR':           return <Zap size={size} color={color} />;
    default:                    return <Square size={size} color={color} />;
  }
};

// ============================================
// COMPONENT
// ============================================

export const AmenitySelector: React.FC<AmenitySelectorProps> = ({
  selectedAmenities,
  onSelectionChange,
}) => {
  const { theme } = useTheme();

  const toggleAmenity = (amenity: AmenityId) => {
    if (selectedAmenities.includes(amenity)) {
      onSelectionChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onSelectionChange([...selectedAmenities, amenity]);
    }
  };

  const groupedAmenities = AMENITIES.reduce(
    (acc, amenity) => {
      if (!acc[amenity.category]) {
        acc[amenity.category] = [];
      }
      acc[amenity.category].push(amenity);
      return acc;
    },
    {} as Record<AmenityCategory, typeof AMENITIES[number][]>,
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {(Object.keys(groupedAmenities) as AmenityCategory[]).map((category) => {
        const items = groupedAmenities[category];
        return (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: theme.colors.textPrimary }]}>
              {AMENITY_CATEGORY_LABELS[category]}
            </Text>
            <View style={styles.amenitiesGrid}>
              {items.map((item) => {
                const isSelected = selectedAmenities.includes(item.id);
                const iconColor = isSelected ? '#ffffff' : theme.colors.primary.main;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.amenityItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary.main
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary.main
                          : theme.colors.border,
                      },
                    ]}
                    onPress={() => toggleAmenity(item.id)}
                    activeOpacity={0.7}
                  >
                    {getIconNode(item.id, iconColor, 20)}
                    <Text
                      style={[
                        styles.amenityLabel,
                        { color: isSelected ? '#ffffff' : theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}

      <View style={styles.selectedCount}>
        <Text style={[styles.selectedCountText, { color: theme.colors.textSecondary }]}>
          {selectedAmenities.length}{' '}
          {selectedAmenities.length === 1 ? 'dotare selectată' : 'dotări selectate'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  amenityLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  selectedCount: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

export default AmenitySelector;
