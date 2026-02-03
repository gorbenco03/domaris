/**
 * RIVA - Filters Screen
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
  TextInput,
} from 'react-native';
import { X, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton, Button, Chip, Divider } from '@/shared/components';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { IAdvancedSearchFilters } from '@/features/search/services';
import AmenitySelector, { type Amenity } from '@/shared/components/AmenitySelector';

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
  const [transactionType, setTransactionType] = useState<string | null>(
    initialFilters.transactionType || null
  );
  const [propertyType, setPropertyType] = useState<string | null>(
    initialFilters.propertyType || null
  );
  const [rooms, setRooms] = useState<string[]>(
    initialFilters.rooms
      ? [String(initialFilters.rooms)]
      : initialFilters.roomsMin || initialFilters.roomsMax
      ? [
          ...(initialFilters.roomsMin ? [String(initialFilters.roomsMin)] : []),
          ...(initialFilters.roomsMax ? [String(initialFilters.roomsMax)] : []),
        ]
      : []
  );

  const [priceRange, setPriceRange] = useState({
    min: initialFilters.priceMin ? String(initialFilters.priceMin) : '',
    max: initialFilters.priceMax ? String(initialFilters.priceMax) : '',
  });

  const [surfaceRange, setSurfaceRange] = useState({
    min: initialFilters.surfaceMin ? String(initialFilters.surfaceMin) : '',
    max: initialFilters.surfaceMax ? String(initialFilters.surfaceMax) : '',
  });

  const [bedroomsRange, setBedroomsRange] = useState({
    min: initialFilters.bedroomsMin ? String(initialFilters.bedroomsMin) : '',
    max: initialFilters.bedroomsMax ? String(initialFilters.bedroomsMax) : '',
  });
  const [bathroomsRange, setBathroomsRange] = useState({
    min: initialFilters.bathroomsMin ? String(initialFilters.bathroomsMin) : '',
    max: initialFilters.bathroomsMax ? String(initialFilters.bathroomsMax) : '',
  });
  const [floorRange, setFloorRange] = useState({
    min: initialFilters.floorMin ? String(initialFilters.floorMin) : '',
    max: initialFilters.floorMax ? String(initialFilters.floorMax) : '',
  });
  const [yearBuiltRange, setYearBuiltRange] = useState({
    min: initialFilters.yearBuiltMin ? String(initialFilters.yearBuiltMin) : '',
    max: initialFilters.yearBuiltMax ? String(initialFilters.yearBuiltMax) : '',
  });

  const [amenities, setAmenities] = useState<Amenity[]>(
    (initialFilters.amenities as Amenity[]) || []
  );
  const [isFurnished, setIsFurnished] = useState<boolean>(
    initialFilters.isFurnished ?? false
  );
  const [hasCentralHeating, setHasCentralHeating] = useState<boolean>(
    initialFilters.hasCentralHeating ?? false
  );
  const [petFriendly, setPetFriendly] = useState<boolean>(
    initialFilters.petFriendly ?? false
  );

  const resetFilters = () => {
    setTransactionType(null);
    setPropertyType(null);
    setRooms([]);
    setPriceRange({ min: '', max: '' });
    setSurfaceRange({ min: '', max: '' });
    setBedroomsRange({ min: '', max: '' });
    setBathroomsRange({ min: '', max: '' });
    setFloorRange({ min: '', max: '' });
    setYearBuiltRange({ min: '', max: '' });
    setAmenities([]);
    setIsFurnished(false);
    setHasCentralHeating(false);
    setPetFriendly(false);
  };

  const toggleSelection = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const toggleSingleSelection = (
    value: string | null,
    item: string,
    setter: (val: string | null) => void
  ) => {
    if (value === item) {
      setter(null);
    } else {
      setter(item);
    }
  };

  const handleApply = () => {
    // Map local state back to API filter params
    const selectedRooms = rooms.map(Number).filter((value) => !Number.isNaN(value));
    const minRoom = selectedRooms.length > 0 ? Math.min(...selectedRooms) : undefined;
    const maxRoom = selectedRooms.length > 0 ? Math.max(...selectedRooms) : undefined;
    const hasOpenEndedRooms = rooms.includes('5');

    const activeFilters: IAdvancedSearchFilters & Record<string, unknown> = {
      ...initialFilters,
      transactionType: transactionType || undefined,
      propertyType: propertyType || undefined,
      roomsMin: minRoom,
      roomsMax: hasOpenEndedRooms ? undefined : maxRoom,
      priceMin: priceRange.min ? Number(priceRange.min) : undefined,
      priceMax: priceRange.max ? Number(priceRange.max) : undefined,
      surfaceMin: surfaceRange.min ? Number(surfaceRange.min) : undefined,
      surfaceMax: surfaceRange.max ? Number(surfaceRange.max) : undefined,
      bedroomsMin: bedroomsRange.min ? Number(bedroomsRange.min) : undefined,
      bedroomsMax: bedroomsRange.max ? Number(bedroomsRange.max) : undefined,
      bathroomsMin: bathroomsRange.min ? Number(bathroomsRange.min) : undefined,
      bathroomsMax: bathroomsRange.max ? Number(bathroomsRange.max) : undefined,
      floorMin: floorRange.min ? Number(floorRange.min) : undefined,
      floorMax: floorRange.max ? Number(floorRange.max) : undefined,
      yearBuiltMin: yearBuiltRange.min ? Number(yearBuiltRange.min) : undefined,
      yearBuiltMax: yearBuiltRange.max ? Number(yearBuiltRange.max) : undefined,
      amenities: amenities.length > 0 ? amenities : undefined,
      isFurnished: isFurnished || undefined,
      hasCentralHeating: hasCentralHeating || undefined,
      petFriendly: petFriendly || undefined,
    };

    Object.keys(activeFilters).forEach(
      (key) => activeFilters[key] === undefined && delete activeFilters[key]
    );

    navigation.goBack();

    requestAnimationFrame(() => {
      navigation.navigate({
        name: 'SearchResults',
        params: { filters: activeFilters },
        merge: true,
      });
    });
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

      <ScrollView
        style={styles.content}
        horizontal={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        alwaysBounceHorizontal={false}
        directionalLockEnabled
        contentContainerStyle={{ width: '100%' }}
      >
        {/* Transaction Type */}
        <FilterSection title="Tip tranzacție">
          <View style={styles.chipsGrid}>
            {['SALE', 'RENT'].map((type) => (
              <Chip
                key={type}
                label={type === 'SALE' ? 'Vânzare' : 'Închiriere'}
                selected={transactionType === type}
                onPress={() => toggleSingleSelection(transactionType, type, setTransactionType)}
                style={styles.chip}
              />
            ))}
          </View>
        </FilterSection>

        <Divider />

        {/* Property Type */}
        <FilterSection title="Tip proprietate">
          <View style={styles.chipsGrid}>
            {[
              { id: 'APARTMENT', label: 'Apartament' },
              { id: 'HOUSE', label: 'Casă' },
              { id: 'STUDIO', label: 'Garsonieră' },
              { id: 'ROOM', label: 'Cameră' },
              { id: 'COMMERCIAL', label: 'Comercial' },
              { id: 'LAND', label: 'Teren' },
              { id: 'OFFICE', label: 'Birou' },
              { id: 'GARAGE', label: 'Garaj' },
              { id: 'OTHER', label: 'Altul' },
            ].map((type) => (
              <Chip
                key={type.id}
                label={type.label}
                selected={propertyType === type.id}
                onPress={() => toggleSingleSelection(propertyType, type.id, setPropertyType)}
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

        {/* Bedrooms */}
        <FilterSection title="Dormitoare">
          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Minim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={bedroomsRange.min}
                onChangeText={(value) => setBedroomsRange((prev) => ({ ...prev, min: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
            <View style={styles.priceSeparator} />
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Maxim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={bedroomsRange.max}
                onChangeText={(value) => setBedroomsRange((prev) => ({ ...prev, max: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="Nelimitat"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          </View>
        </FilterSection>

        <Divider />

        {/* Bathrooms */}
        <FilterSection title="Băi">
          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Minim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={bathroomsRange.min}
                onChangeText={(value) => setBathroomsRange((prev) => ({ ...prev, min: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
            <View style={styles.priceSeparator} />
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Maxim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={bathroomsRange.max}
                onChangeText={(value) => setBathroomsRange((prev) => ({ ...prev, max: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="Nelimitat"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          </View>
        </FilterSection>

        <Divider />

        {/* Price Range */}
        <FilterSection title="Interval preț (€)">
          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>
                Minim
              </Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={priceRange.min}
                onChangeText={(value) => setPriceRange((prev) => ({ ...prev, min: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
            <View style={styles.priceSeparator} />
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>
                Maxim
              </Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={priceRange.max}
                onChangeText={(value) => setPriceRange((prev) => ({ ...prev, max: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="Nelimitat"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          </View>
          {/* Slider placeholder */}
          <View style={[styles.sliderPlaceholder, { backgroundColor: theme.colors.divider }]} />
        </FilterSection>

        <Divider />

        {/* Floor */}
        <FilterSection title="Etaj">
          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Minim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={floorRange.min}
                onChangeText={(value) => setFloorRange((prev) => ({ ...prev, min: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
            <View style={styles.priceSeparator} />
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Maxim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={floorRange.max}
                onChangeText={(value) => setFloorRange((prev) => ({ ...prev, max: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="Nelimitat"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          </View>
        </FilterSection>

        <Divider />

        {/* Year Built */}
        <FilterSection title="An construcție">
          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Minim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={yearBuiltRange.min}
                onChangeText={(value) => setYearBuiltRange((prev) => ({ ...prev, min: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="1900"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
            <View style={styles.priceSeparator} />
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>Maxim</Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={yearBuiltRange.max}
                onChangeText={(value) => setYearBuiltRange((prev) => ({ ...prev, max: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="Nelimitat"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          </View>
        </FilterSection>

        <Divider />

        {/* Surface Range */}
        <FilterSection title="Suprafață (m²)">
          <View style={styles.row}>
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>
                Minim
              </Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={surfaceRange.min}
                onChangeText={(value) => setSurfaceRange((prev) => ({ ...prev, min: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
            <View style={styles.priceSeparator} />
            <View
              style={[
                styles.priceInput,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.priceLabel, { color: theme.colors.textTertiary }]}>
                Maxim
              </Text>
              <TextInput
                style={[styles.priceValue, { color: theme.colors.textPrimary }]}
                value={surfaceRange.max}
                onChangeText={(value) => setSurfaceRange((prev) => ({ ...prev, max: value }))}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="Nelimitat"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>
          </View>
        </FilterSection>

        <Divider />

        {/* Amenities */}
        <FilterSection title="Dotări și facilități">
          <View style={styles.amenitiesContainer}>
            <AmenitySelector
              selectedAmenities={amenities}
              onSelectionChange={setAmenities}
            />
          </View>
        </FilterSection>

        <Divider />

        {/* Preferences */}
        <FilterSection title="Preferințe">
          <View style={styles.chipsGrid}>
            <Chip
              label="Mobilat"
              selected={isFurnished}
              onPress={() => setIsFurnished((prev) => !prev)}
              style={styles.chip}
            />
            <Chip
              label="Încălzire centrală"
              selected={hasCentralHeating}
              onPress={() => setHasCentralHeating((prev) => !prev)}
              style={styles.chip}
            />
            <Chip
              label="Animale permise"
              selected={petFriendly}
              onPress={() => setPetFriendly((prev) => !prev)}
              style={styles.chip}
            />
          </View>
        </FilterSection>

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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  amenitiesContainer: {
    height: 360,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});

export default FiltersScreen;
