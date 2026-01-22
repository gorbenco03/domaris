/**
 * IMOBI - Filters Screen
 * Advanced search filters modal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { X, RotateCcw, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton, Button, Chip, Divider } from '@/shared/components';
import { useNavigation, useRoute } from '@react-navigation/native';

// ============================================
// TYPES
// ============================================

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

// ============================================
// SUB-COMPONENTS
// ============================================

const FilterSection: React.FC<FilterSectionProps> = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

// ============================================
// MAIN COMPONENT
// ============================================

const FiltersScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Initial filters from navigation params
  const initialFilters = route.params?.filters || {};

  // State initialization from params
  const [propertyType, setPropertyType] = useState<string[]>(
    initialFilters.propertyType ? [initialFilters.propertyType] : []
  );
  const [rooms, setRooms] = useState<string[]>(
    initialFilters.minRooms ? [String(initialFilters.minRooms)] : []
  );
  // Note: Backend might expect numbers, UI uses strings. We map loosely here.
  
  const [priceRange, setPriceRange] = useState({ 
    min: initialFilters.minPrice ? String(initialFilters.minPrice) : '', 
    max: initialFilters.maxPrice ? String(initialFilters.maxPrice) : '' 
  });

  const [comfort, setComfort] = useState<string | null>(null); // Not fully mapped to backend yet

  const resetFilters = () => {
    setPropertyType([]);
    setRooms([]);
    setComfort(null);
    setPriceRange({ min: '', max: '' });
  };

  const toggleSelection = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleApply = () => {
    // Map local state back to API filter params
    const activeFilters: any = {
      ...initialFilters,
      propertyType: propertyType.length > 0 ? propertyType[0] : undefined, // Backend usually takes one type or array depending on impl
      minRooms: rooms.length > 0 ? Math.min(...rooms.map(Number)) : undefined,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
    };

    // Clean undefined
    Object.keys(activeFilters).forEach(key => activeFilters[key] === undefined && delete activeFilters[key]);

    navigation.navigate('SearchResults', { filters: activeFilters });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <IconButton
          icon={<X size={24} color={theme.colors.textPrimary} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Filtrează rezultatele
        </Text>
        <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
          <RotateCcw size={16} color={theme.colors.primary.main} />
          <Text style={[styles.resetText, { color: theme.colors.primary.main }]}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Type */}
        <FilterSection title="Tipul proprietății">
          <View style={styles.chipsGrid}>
            {['APARTMENT', 'HOUSE', 'STUDIO', 'PENTHOUSE', 'LAND'].map((type) => (
              <Chip
                key={type}
                label={type === 'APARTMENT' ? 'Apartament' : type === 'HOUSE' ? 'Casă' : type === 'STUDIO' ? 'Garsonieră' : type === 'PENTHOUSE' ? 'Penthouse' : 'Teren'}
                selected={propertyType.includes(type)}
                onPress={() => toggleSelection(propertyType, type, setPropertyType)}
                style={styles.chip}
              />
            ))}
          </View>
        </FilterSection>

        <Divider />

        {/* Rooms */}
        <FilterSection title="Număr camere">
          <View style={styles.chipsGrid}>
            {['1', '2', '3', '4'].map((num) => (
              <Chip
                key={num}
                label={num}
                selected={rooms.includes(num)}
                onPress={() => toggleSelection(rooms, num, setRooms)}
                style={styles.circleChip}
              />
            ))}
             <Chip
                label="5+"
                selected={rooms.includes('5')}
                onPress={() => toggleSelection(rooms, '5', setRooms)}
                style={styles.circleChip}
              />
          </View>
        </FilterSection>

        <Divider />

        {/* Price Range */}
        <FilterSection title="Interval preț (€)">
          <View style={styles.row}>
            <View style={[styles.priceInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Minim</Text>
              {/* Simple Text Input would be better here, using Text for UI mockup */}
              <Text style={[styles.priceValue, { color: theme.colors.textPrimary }]}>{priceRange.min || '0'} €</Text>
            </View>
            <View style={styles.priceSeparator} />
            <View style={[styles.priceInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Maxim</Text>
              <Text style={[styles.priceValue, { color: theme.colors.textPrimary }]}>{priceRange.max || 'Nelimitat'}</Text>
            </View>
          </View>
          {/* Slider placeholder */}
          <View style={[styles.sliderPlaceholder, { backgroundColor: theme.colors.divider }]} />
        </FilterSection>

        <Divider />

        {/* Amenities Selection */}
        <TouchableOpacity style={styles.moreFiltersRow}>
          <Text style={[styles.moreFiltersText, { color: theme.colors.textPrimary }]}>
            Dotări și facilități
          </Text>
          <View style={styles.moreFiltersRight}>
             <Text style={[styles.selectedCount, { color: theme.colors.textTertiary }]}>Selectează</Text>
             <ChevronRight size={20} color={theme.colors.textTertiary} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
        <Button
          title="Vezi rezultate"
          onPress={handleApply}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  resetText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  sectionContent: {
    gap: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
  },
  circleChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  priceSeparator: {
    width: 12,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  sliderPlaceholder: {
    height: 40,
    width: '100%',
    borderRadius: 8,
    marginTop: 20,
    opacity: 0.3,
  },
  moreFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  moreFiltersText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  moreFiltersRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});

export default FiltersScreen;
