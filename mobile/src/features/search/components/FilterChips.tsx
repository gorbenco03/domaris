/**
 * IMOBI - Filter Chips Component
 * Horizontal scrollable filter chips
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Chip } from '@/shared/components/Chip';

// ============================================
// TYPES
// ============================================

type TransactionType = 'SALE' | 'RENT';
type PropertyType = 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'LAND' | 'COMMERCIAL';

interface FilterState {
  transactionType: TransactionType | null;
  propertyType: PropertyType | null;
  priceRange: { min?: number; max?: number } | null;
  rooms: { min?: number; max?: number } | null;
  area: { min?: number; max?: number } | null;
}

interface FilterChipsProps {
  filters: FilterState;
  onFilterPress: (filterType: keyof FilterState) => void;
  onFiltersPress: () => void;
  activeFiltersCount: number;
}

// ============================================
// DATA
// ============================================

const TRANSACTION_LABELS: Record<TransactionType, string> = {
  SALE: 'Vânzare',
  RENT: 'Închiriere',
};

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casă',
  STUDIO: 'Garsonieră',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
};

// ============================================
// COMPONENT
// ============================================

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onFilterPress,
  onFiltersPress,
  activeFiltersCount,
}) => {
  const { theme } = useTheme();

  const getTransactionLabel = () => {
    if (filters.transactionType) {
      return TRANSACTION_LABELS[filters.transactionType];
    }
    return 'Tip';
  };

  const getPropertyTypeLabel = () => {
    if (filters.propertyType) {
      return PROPERTY_TYPE_LABELS[filters.propertyType];
    }
    return 'Proprietate';
  };

  const getPriceLabel = () => {
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      if (min && max) {
        return `${min/1000}k - ${max/1000}k €`;
      } else if (min) {
        return `de la ${min/1000}k €`;
      } else if (max) {
        return `până la ${max/1000}k €`;
      }
    }
    return 'Preț';
  };

  const getRoomsLabel = () => {
    if (filters.rooms) {
      const { min, max } = filters.rooms;
      if (min && max) {
        return `${min}-${max} camere`;
      } else if (min) {
        return `${min}+ camere`;
      }
    }
    return 'Camere';
  };

  const getAreaLabel = () => {
    if (filters.area) {
      const { min, max } = filters.area;
      if (min && max) {
        return `${min}-${max} m²`;
      } else if (min) {
        return `${min}+ m²`;
      }
    }
    return 'Suprafață';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {/* Transaction Type */}
        <Chip
          label={getTransactionLabel()}
          selected={!!filters.transactionType}
          hasDropdown
          onPress={() => onFilterPress('transactionType')}
        />

        {/* Property Type */}
        <Chip
          label={getPropertyTypeLabel()}
          selected={!!filters.propertyType}
          hasDropdown
          onPress={() => onFilterPress('propertyType')}
        />

        {/* Price Range */}
        <Chip
          label={getPriceLabel()}
          selected={!!filters.priceRange}
          hasDropdown
          onPress={() => onFilterPress('priceRange')}
        />

        {/* Rooms */}
        <Chip
          label={getRoomsLabel()}
          selected={!!filters.rooms}
          hasDropdown
          onPress={() => onFilterPress('rooms')}
        />

        {/* Area */}
        <Chip
          label={getAreaLabel()}
          selected={!!filters.area}
          hasDropdown
          onPress={() => onFilterPress('area')}
        />

        {/* More Filters Button */}
        <TouchableOpacity
          style={[
            styles.moreFiltersButton,
            {
              backgroundColor: activeFiltersCount > 0 
                ? theme.colors.primary.main 
                : theme.colors.surface,
              borderColor: activeFiltersCount > 0 
                ? theme.colors.primary.main 
                : theme.colors.border,
            },
          ]}
          onPress={onFiltersPress}
          activeOpacity={0.8}
        >
          <SlidersHorizontal 
            size={18} 
            color={activeFiltersCount > 0 ? '#ffffff' : theme.colors.textSecondary} 
          />
          <Text
            style={[
              styles.moreFiltersText,
              {
                color: activeFiltersCount > 0 ? '#ffffff' : theme.colors.textSecondary,
              },
            ]}
          >
            Filtre
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    gap: 6,
  },
  moreFiltersText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter-Bold',
  },
});

export default FilterChips;
