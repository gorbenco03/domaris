/**
 * IMOBI - Property Type Selector Component
 * Grid of property type options for listing wizard
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Building2,
  Home,
  Building,
  Star,
  Layers,
  MapPin,
  Store,
  Briefcase,
  Car,
  Package,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

export type PropertyType = 
  | 'APARTMENT'
  | 'HOUSE'
  | 'STUDIO'
  | 'PENTHOUSE'
  | 'DUPLEX'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'PARKING'
  | 'STORAGE';

interface PropertyTypeOption {
  type: PropertyType;
  label: string;
  icon: React.ReactNode;
}

interface PropertyTypeSelectorProps {
  selectedType: PropertyType | null;
  onSelect: (type: PropertyType) => void;
  transactionType?: 'SALE' | 'RENT';
}

// ============================================
// DATA
// ============================================

const getPropertyTypes = (iconColor: string, iconSize: number): PropertyTypeOption[] => [
  {
    type: 'APARTMENT',
    label: 'Apartament',
    icon: <Building2 size={iconSize} color={iconColor} />,
  },
  {
    type: 'HOUSE',
    label: 'Casă/Vilă',
    icon: <Home size={iconSize} color={iconColor} />,
  },
  {
    type: 'STUDIO',
    label: 'Garsonieră',
    icon: <Building size={iconSize} color={iconColor} />,
  },
  {
    type: 'PENTHOUSE',
    label: 'Penthouse',
    icon: <Star size={iconSize} color={iconColor} />,
  },
  {
    type: 'DUPLEX',
    label: 'Duplex',
    icon: <Layers size={iconSize} color={iconColor} />,
  },
  {
    type: 'LAND',
    label: 'Teren',
    icon: <MapPin size={iconSize} color={iconColor} />,
  },
  {
    type: 'COMMERCIAL',
    label: 'Comercial',
    icon: <Store size={iconSize} color={iconColor} />,
  },
  {
    type: 'OFFICE',
    label: 'Birou',
    icon: <Briefcase size={iconSize} color={iconColor} />,
  },
  {
    type: 'PARKING',
    label: 'Parcare',
    icon: <Car size={iconSize} color={iconColor} />,
  },
  {
    type: 'STORAGE',
    label: 'Depozit',
    icon: <Package size={iconSize} color={iconColor} />,
  },
];

// ============================================
// PROPERTY TYPE CARD
// ============================================

interface TypeCardProps {
  option: PropertyTypeOption;
  selected: boolean;
  onPress: () => void;
}

const TypeCard: React.FC<TypeCardProps> = ({ option, selected, onPress }) => {
  const { theme } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const iconColor = selected ? '#ffffff' : theme.colors.primary.main;
  const iconSize = 28;

  // Create icon with correct colors
  const IconComponent = () => {
    const icons: Record<PropertyType, React.ReactNode> = {
      APARTMENT: <Building2 size={iconSize} color={iconColor} />,
      HOUSE: <Home size={iconSize} color={iconColor} />,
      STUDIO: <Building size={iconSize} color={iconColor} />,
      PENTHOUSE: <Star size={iconSize} color={iconColor} />,
      DUPLEX: <Layers size={iconSize} color={iconColor} />,
      LAND: <MapPin size={iconSize} color={iconColor} />,
      COMMERCIAL: <Store size={iconSize} color={iconColor} />,
      OFFICE: <Briefcase size={iconSize} color={iconColor} />,
      PARKING: <Car size={iconSize} color={iconColor} />,
      STORAGE: <Package size={iconSize} color={iconColor} />,
    };
    return icons[option.type];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      testID={`property-type-${option.type.toLowerCase()}`}
    >
      <Animated.View
        style={[
          styles.typeCard,
          {
            backgroundColor: selected ? theme.colors.primary.main : theme.colors.surface,
            borderColor: selected ? theme.colors.primary.main : theme.colors.border,
            borderRadius: theme.borderRadius.lg,
            transform: [{ scale }],
          },
          selected && theme.shadows.md,
        ]}
      >
        <View style={styles.iconContainer}>
          <IconComponent />
        </View>
        <Text
          style={[
            styles.typeLabel,
            {
              color: selected ? '#ffffff' : theme.colors.textPrimary,
            },
          ]}
          numberOfLines={2}
        >
          {option.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  const { theme } = useTheme();
  const propertyTypes = getPropertyTypes(theme.colors.primary.main, 28);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Tip proprietate
      </Text>
      <View style={styles.grid}>
        {propertyTypes.map((option) => (
          <TypeCard
            key={option.type}
            option={option}
            selected={selectedType === option.type}
            onPress={() => onSelect(option.type)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeCard: {
    flexBasis: '30%',
    maxWidth: '30%',
    minHeight: 120,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default PropertyTypeSelector;
