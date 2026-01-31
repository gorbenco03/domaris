/**
 * RIVA - Amenity Selector Component
 * Multi-select amenities/features grid
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
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

export type Amenity =
  | 'AIR_CONDITIONING'
  | 'CENTRAL_HEATING'
  | 'UNDERFLOOR_HEATING'
  | 'FIREPLACE'
  | 'ELEVATOR'
  | 'FURNISHED'
  | 'SEMI_FURNISHED'
  | 'KITCHEN_APPLIANCES'
  | 'WASHER'
  | 'DRYER'
  | 'DISHWASHER'
  | 'BALCONY'
  | 'TERRACE'
  | 'GARDEN'
  | 'POOL'
  | 'SAUNA'
  | 'GYM'
  | 'STORAGE'
  | 'SECURITY_SYSTEM'
  | 'VIDEO_INTERCOM'
  | 'SMART_HOME'
  | 'FIBER_INTERNET'
  | 'CABLE_TV'
  | 'PET_FRIENDLY';

interface AmenityOption {
  id: Amenity;
  label: string;
  icon: React.ReactNode;
  category: 'comfort' | 'appliances' | 'outdoor' | 'security' | 'tech';
}

interface AmenitySelectorProps {
  selectedAmenities: Amenity[];
  onSelectionChange: (amenities: Amenity[]) => void;
}

// ============================================
// DATA
// ============================================

const AMENITIES: (iconColor: string, iconSize: number) => AmenityOption[] = (iconColor, iconSize) => [
  // Comfort
  { id: 'AIR_CONDITIONING', label: 'Aer condiționat', icon: <Wind size={iconSize} color={iconColor} />, category: 'comfort' },
  { id: 'CENTRAL_HEATING', label: 'Încălzire centrală', icon: <ThermometerSun size={iconSize} color={iconColor} />, category: 'comfort' },
  { id: 'UNDERFLOOR_HEATING', label: 'Încălzire pardoseală', icon: <ThermometerSun size={iconSize} color={iconColor} />, category: 'comfort' },
  { id: 'FIREPLACE', label: 'Șemineu', icon: <Flame size={iconSize} color={iconColor} />, category: 'comfort' },
  { id: 'ELEVATOR', label: 'Lift', icon: <ArrowUp size={iconSize} color={iconColor} />, category: 'comfort' },
  { id: 'FURNISHED', label: 'Mobilat', icon: <Sofa size={iconSize} color={iconColor} />, category: 'comfort' },
  { id: 'SEMI_FURNISHED', label: 'Semrivalat', icon: <Sofa size={iconSize} color={iconColor} />, category: 'comfort' },
  
  // Appliances
  { id: 'KITCHEN_APPLIANCES', label: 'Bucătărie utilată', icon: <Utensils size={iconSize} color={iconColor} />, category: 'appliances' },
  { id: 'WASHER', label: 'Mașină spălat', icon: <WashingMachine size={iconSize} color={iconColor} />, category: 'appliances' },
  { id: 'DRYER', label: 'Uscător', icon: <Droplets size={iconSize} color={iconColor} />, category: 'appliances' },
  { id: 'DISHWASHER', label: 'Mașină vase', icon: <Droplets size={iconSize} color={iconColor} />, category: 'appliances' },
  
  // Outdoor
  { id: 'BALCONY', label: 'Balcon', icon: <Square size={iconSize} color={iconColor} />, category: 'outdoor' },
  { id: 'TERRACE', label: 'Terasă', icon: <Square size={iconSize} color={iconColor} />, category: 'outdoor' },
  { id: 'GARDEN', label: 'Grădină', icon: <TreePine size={iconSize} color={iconColor} />, category: 'outdoor' },
  { id: 'POOL', label: 'Piscină', icon: <Waves size={iconSize} color={iconColor} />, category: 'outdoor' },
  { id: 'SAUNA', label: 'Saună', icon: <Flame size={iconSize} color={iconColor} />, category: 'outdoor' },
  { id: 'GYM', label: 'Sală fitness', icon: <Dumbbell size={iconSize} color={iconColor} />, category: 'outdoor' },
  { id: 'STORAGE', label: 'Boxă', icon: <Package size={iconSize} color={iconColor} />, category: 'outdoor' },
  
  // Security
  { id: 'SECURITY_SYSTEM', label: 'Sistem securitate', icon: <Shield size={iconSize} color={iconColor} />, category: 'security' },
  { id: 'VIDEO_INTERCOM', label: 'Interfon video', icon: <Video size={iconSize} color={iconColor} />, category: 'security' },
  { id: 'SMART_HOME', label: 'Smart Home', icon: <Smartphone size={iconSize} color={iconColor} />, category: 'security' },
  
  // Tech
  { id: 'FIBER_INTERNET', label: 'Internet fibră', icon: <Wifi size={iconSize} color={iconColor} />, category: 'tech' },
  { id: 'CABLE_TV', label: 'Cablu TV', icon: <Tv size={iconSize} color={iconColor} />, category: 'tech' },
  { id: 'PET_FRIENDLY', label: 'Animale permise', icon: <PawPrint size={iconSize} color={iconColor} />, category: 'tech' },
];

const CATEGORY_LABELS: Record<string, string> = {
  comfort: 'Confort',
  appliances: 'Electrocasnice',
  outdoor: 'Exterior',
  security: 'Securitate',
  tech: 'Tehnologie',
};

// ============================================
// COMPONENT
// ============================================

export const AmenitySelector: React.FC<AmenitySelectorProps> = ({
  selectedAmenities,
  onSelectionChange,
}) => {
  const { theme } = useTheme();
  const amenities = AMENITIES(theme.colors.primary.main, 20);

  const toggleAmenity = (amenity: Amenity) => {
    if (selectedAmenities.includes(amenity)) {
      onSelectionChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onSelectionChange([...selectedAmenities, amenity]);
    }
  };

  const groupedAmenities = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, AmenityOption[]>);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {Object.entries(groupedAmenities).map(([category, items]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={[styles.categoryTitle, { color: theme.colors.textPrimary }]}>
            {CATEGORY_LABELS[category]}
          </Text>
          <View style={styles.amenitiesGrid}>
            {items.map((item) => {
              const isSelected = selectedAmenities.includes(item.id);
              const iconColor = isSelected ? '#ffffff' : theme.colors.primary.main;
              
              // Re-render icon with correct color
              const Icon = () => {
                const icons: Record<string, React.ReactNode> = {
                  AIR_CONDITIONING: <Wind size={20} color={iconColor} />,
                  CENTRAL_HEATING: <ThermometerSun size={20} color={iconColor} />,
                  UNDERFLOOR_HEATING: <ThermometerSun size={20} color={iconColor} />,
                  FIREPLACE: <Flame size={20} color={iconColor} />,
                  ELEVATOR: <ArrowUp size={20} color={iconColor} />,
                  FURNISHED: <Sofa size={20} color={iconColor} />,
                  SEMI_FURNISHED: <Sofa size={20} color={iconColor} />,
                  KITCHEN_APPLIANCES: <Utensils size={20} color={iconColor} />,
                  WASHER: <WashingMachine size={20} color={iconColor} />,
                  DRYER: <Droplets size={20} color={iconColor} />,
                  DISHWASHER: <Droplets size={20} color={iconColor} />,
                  BALCONY: <Square size={20} color={iconColor} />,
                  TERRACE: <Square size={20} color={iconColor} />,
                  GARDEN: <TreePine size={20} color={iconColor} />,
                  POOL: <Waves size={20} color={iconColor} />,
                  SAUNA: <Flame size={20} color={iconColor} />,
                  GYM: <Dumbbell size={20} color={iconColor} />,
                  STORAGE: <Package size={20} color={iconColor} />,
                  SECURITY_SYSTEM: <Shield size={20} color={iconColor} />,
                  VIDEO_INTERCOM: <Video size={20} color={iconColor} />,
                  SMART_HOME: <Smartphone size={20} color={iconColor} />,
                  FIBER_INTERNET: <Wifi size={20} color={iconColor} />,
                  CABLE_TV: <Tv size={20} color={iconColor} />,
                  PET_FRIENDLY: <PawPrint size={20} color={iconColor} />,
                };
                return icons[item.id];
              };

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
                  <Icon />
                  <Text
                    style={[
                      styles.amenityLabel,
                      {
                        color: isSelected ? '#ffffff' : theme.colors.textPrimary,
                      },
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
      ))}

      {/* Selected count */}
      <View style={styles.selectedCount}>
        <Text style={[styles.selectedCountText, { color: theme.colors.textSecondary }]}>
          {selectedAmenities.length} {selectedAmenities.length === 1 ? 'dotare selectată' : 'dotări selectate'}
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
