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
import type { IAdvancedSearchFilters } from '@/features/search/services';

// ============================================
// TYPES
// ============================================

type FilterChipKey = 'transactionType' | 'propertyType' | 'price' | 'rooms' | 'surface';

interface FilterChipsProps {
  filters: IAdvancedSearchFilters;
  onFilterPress: (filterType: FilterChipKey) => void;
  onFiltersPress: () => void;
  activeFiltersCount: number;
}

// ============================================
// DATA
// ============================================

const TRANSACTION_LABELS: Record<string, string> = {
  SALE: 'Vânzare',
  RENT: 'Închiriere',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casă',
  STUDIO: 'Garsonieră',
  ROOM: 'Cameră',
  COMMERCIAL: 'Comercial',
  LAND: 'Teren',
  OFFICE: 'Birou',
  GARAGE: 'Garaj',
  OTHER: 'Altul',
};

// ============================================
// COMPONENT
// ============================================

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters = {} as IAdvancedSearchFilters,
  onFilterPress,
  onFiltersPress,
  activeFiltersCount,
}) => {
  const { theme } = useTheme();
  const safeFilters: IAdvancedSearchFilters = filters || {};

  const getTransactionLabel = () => {
    if (safeFilters.transactionType) {
      return TRANSACTION_LABELS[safeFilters.transactionType] || safeFilters.transactionType;
    }
    return 'Tranzacție';
  };

  const getPropertyTypeLabel = () => {
    if (safeFilters.propertyType) {
      return PROPERTY_TYPE_LABELS[safeFilters.propertyType] || safeFilters.propertyType;
    }
    return 'Proprietate';
  };

  const getPriceLabel = () => {
    const { priceMin, priceMax } = safeFilters;
    if (priceMin !== undefined || priceMax !== undefined) {
      if (priceMin !== undefined && priceMax !== undefined) {
        return `${Math.round(priceMin / 1000)}k - ${Math.round(priceMax / 1000)}k €`;
      }
      if (priceMin !== undefined) {
        return `de la ${Math.round(priceMin / 1000)}k €`;
      }
      return `până la ${Math.round((priceMax || 0) / 1000)}k €`;
    }
    return 'Preț';
  };

  const getRoomsLabel = () => {
    if (
      safeFilters.roomsMin !== undefined ||
      safeFilters.roomsMax !== undefined ||
      safeFilters.rooms !== undefined
    ) {
      if (safeFilters.rooms !== undefined) {
        return `${safeFilters.rooms} camere`;
      }
      if (safeFilters.roomsMin !== undefined && safeFilters.roomsMax !== undefined) {
        return `${safeFilters.roomsMin}-${safeFilters.roomsMax} camere`;
      }
      if (safeFilters.roomsMin !== undefined) {
        return `${safeFilters.roomsMin}+ camere`;
      }
    }
    return 'Camere';
  };

  const getSurfaceLabel = () => {
    if (safeFilters.surfaceMin !== undefined || safeFilters.surfaceMax !== undefined) {
      if (safeFilters.surfaceMin !== undefined && safeFilters.surfaceMax !== undefined) {
        return `${safeFilters.surfaceMin}-${safeFilters.surfaceMax} m²`;
      }
      if (safeFilters.surfaceMin !== undefined) {
        return `${safeFilters.surfaceMin}+ m²`;
      }
      return `până la ${safeFilters.surfaceMax} m²`;
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
          selected={!!safeFilters.transactionType}
          hasDropdown
          onPress={() => onFilterPress('transactionType')}
        />

        {/* Property Type */}
        <Chip
          label={getPropertyTypeLabel()}
          selected={!!safeFilters.propertyType}
          hasDropdown
          onPress={() => onFilterPress('propertyType')}
        />

        {/* Price Range */}
        <Chip
          label={getPriceLabel()}
          selected={safeFilters.priceMin !== undefined || safeFilters.priceMax !== undefined}
          hasDropdown
          onPress={() => onFilterPress('price')}
        />

        {/* Rooms */}
        <Chip
          label={getRoomsLabel()}
          selected={
            safeFilters.rooms !== undefined ||
            safeFilters.roomsMin !== undefined ||
            safeFilters.roomsMax !== undefined
          }
          hasDropdown
          onPress={() => onFilterPress('rooms')}
        />

        {/* Surface */}
        <Chip
          label={getSurfaceLabel()}
          selected={safeFilters.surfaceMin !== undefined || safeFilters.surfaceMax !== undefined}
          hasDropdown
          onPress={() => onFilterPress('surface')}
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
