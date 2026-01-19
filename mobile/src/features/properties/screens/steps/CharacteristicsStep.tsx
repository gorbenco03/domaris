/**
 * IMOBI - Characteristics Step
 * Step 3 of property creation wizard
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Maximize2,
  Home,
  Bed,
  Bath,
  Layers,
  Calendar,
  Compass,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import Input from '@/shared/components/Input';
import Chip from '@/shared/components/Chip';
import { AmenitySelector, Amenity } from '@/features/properties/components/AmenitySelector';
import type { PropertyFormData } from '../CreatePropertyWizard';

// ============================================
// TYPES
// ============================================

interface CharacteristicsStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const COMFORT_OPTIONS = [
  { id: 'LUXURY', label: 'Lux' },
  { id: 'INCREASED', label: 'Sporit' },
  { id: 'STANDARD', label: 'Standard' },
  { id: 'REDUCED', label: 'Redus' },
];

const ORIENTATION_OPTIONS = [
  { id: 'N', label: 'Nord' },
  { id: 'S', label: 'Sud' },
  { id: 'E', label: 'Est' },
  { id: 'W', label: 'Vest' },
];

// ============================================
// COMPONENT
// ============================================

const CharacteristicsStep: React.FC<CharacteristicsStepProps> = ({
  formData,
  updateFormData,
}) => {
  const { theme } = useTheme();
  const [selectedOrientations, setSelectedOrientations] = useState<string[]>([]);

  const updateCharacteristics = (updates: Partial<NonNullable<PropertyFormData['characteristics']>>) => {
    updateFormData({
      characteristics: {
        totalArea: 0,
        amenities: [],
        utilities: [],
        ...formData.characteristics,
        ...updates,
      },
    });
  };

  const handleOrientationToggle = (orientation: string) => {
    const newOrientations = selectedOrientations.includes(orientation)
      ? selectedOrientations.filter((o) => o !== orientation)
      : [...selectedOrientations, orientation];
    
    setSelectedOrientations(newOrientations);
    updateCharacteristics({ orientation: newOrientations });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Detalii proprietate
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Adaugă caracteristicile proprietății tale
      </Text>

      {/* Surface Area */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          📐 Suprafață
        </Text>
        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Suprafață totală (m²) *
            </Text>
            <Input
              value={formData.characteristics?.totalArea?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ totalArea: parseInt(val) || 0 })}
              placeholder="75"
              keyboardType="numeric"
              leftIcon={<Maximize2 size={20} color={theme.colors.textSecondary} />}
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Suprafață utilă (m²)
            </Text>
            <Input
              value={formData.characteristics?.usableArea?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ usableArea: parseInt(val) || 0 })}
              placeholder="68"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Rooms */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🏠 Structură
        </Text>
        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Camere
            </Text>
            <Input
              value={formData.characteristics?.rooms?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ rooms: parseInt(val) || 0 })}
              placeholder="3"
              keyboardType="numeric"
              leftIcon={<Home size={20} color={theme.colors.textSecondary} />}
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Dormitoare
            </Text>
            <Input
              value={formData.characteristics?.bedrooms?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ bedrooms: parseInt(val) || 0 })}
              placeholder="2"
              keyboardType="numeric"
              leftIcon={<Bed size={20} color={theme.colors.textSecondary} />}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Băi
            </Text>
            <Input
              value={formData.characteristics?.bathrooms?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ bathrooms: parseInt(val) || 0 })}
              placeholder="1"
              keyboardType="numeric"
              leftIcon={<Bath size={20} color={theme.colors.textSecondary} />}
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Balcoane
            </Text>
            <Input
              value={formData.characteristics?.balconies?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ balconies: parseInt(val) || 0 })}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Floor */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🏢 Etaj
        </Text>
        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Etaj
            </Text>
            <Input
              value={formData.characteristics?.floor?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ floor: parseInt(val) || 0 })}
              placeholder="4"
              keyboardType="numeric"
              leftIcon={<Layers size={20} color={theme.colors.textSecondary} />}
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Din total
            </Text>
            <Input
              value={formData.characteristics?.totalFloors?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ totalFloors: parseInt(val) || 0 })}
              placeholder="10"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              An construcție
            </Text>
            <Input
              value={formData.characteristics?.yearBuilt?.toString() || ''}
              onChangeText={(val: string) => updateCharacteristics({ yearBuilt: parseInt(val) || 0 })}
              placeholder="2018"
              keyboardType="numeric"
              leftIcon={<Calendar size={18} color={theme.colors.textSecondary} />}
            />
          </View>
        </View>
      </View>

      {/* Orientation */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🧭 Orientare
        </Text>
        <View style={styles.chipsRow}>
          {ORIENTATION_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={selectedOrientations.includes(option.id)}
              onPress={() => handleOrientationToggle(option.id)}
              variant="filter"
            />
          ))}
        </View>
      </View>

      {/* Comfort */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          ⭐ Nivel confort
        </Text>
        <View style={styles.chipsRow}>
          {COMFORT_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={formData.characteristics?.comfort === option.id}
              onPress={() => updateCharacteristics({ comfort: option.id })}
              variant="filter"
            />
          ))}
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          ✨ Dotări și facilități
        </Text>
        <AmenitySelector
          selectedAmenities={(formData.characteristics?.amenities || []) as Amenity[]}
          onSelectionChange={(amenities) => updateCharacteristics({ amenities })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

export default CharacteristicsStep;
