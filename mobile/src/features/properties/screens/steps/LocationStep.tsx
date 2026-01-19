/**
 * IMOBI - Location Step
 * Step 2 of property creation wizard
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import Input from '@/shared/components/Input';
import Card from '@/shared/components/Card';
import type { PropertyFormData } from '../CreatePropertyWizard';

// ============================================
// TYPES
// ============================================

interface LocationStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

// ============================================
// MOCK DATA
// ============================================

const COUNTIES = [
  'București', 'Cluj', 'Timiș', 'Iași', 'Constanța', 'Brașov',
];

const CITIES: Record<string, string[]> = {
  'București': ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6'],
  'Cluj': ['Cluj-Napoca', 'Turda', 'Dej', 'Câmpia Turzii'],
  'Timiș': ['Timișoara', 'Lugoj', 'Sânnicolau Mare'],
};

// ============================================
// COMPONENT
// ============================================

const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  updateFormData,
}) => {
  const { theme } = useTheme();
  const [showCountyPicker, setShowCountyPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const updateLocation = (updates: Partial<NonNullable<PropertyFormData['location']>>) => {
    updateFormData({
      location: {
        country: 'România',
        county: '',
        city: '',
        ...formData.location,
        ...updates,
      },
    });
  };

  const handleUseCurrentLocation = () => {
    // In a real app, this would use GPS
    updateLocation({
      county: 'București',
      city: 'Sector 6',
      coordinates: {
        latitude: 44.4268,
        longitude: 26.1025,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Unde se află proprietatea?
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Adaugă adresa completă pentru vizibilitate maximă
      </Text>

      {/* Use Current Location Button */}
      <TouchableOpacity
        style={[
          styles.currentLocationButton,
          { 
            backgroundColor: `${theme.colors.accent.main}15`,
            borderColor: theme.colors.accent.main,
          }
        ]}
        onPress={handleUseCurrentLocation}
        activeOpacity={0.8}
      >
        <Navigation size={20} color={theme.colors.accent.main} />
        <Text style={[styles.currentLocationText, { color: theme.colors.accent.main }]}>
          Folosește locația curentă
        </Text>
      </TouchableOpacity>

      {/* County Selector */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Județ / Sector *
        </Text>
        <TouchableOpacity
          style={[
            styles.selector,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => setShowCountyPicker(!showCountyPicker)}
        >
          <MapPin size={20} color={theme.colors.textSecondary} />
          <Text 
            style={[
              styles.selectorText, 
              { 
                color: formData.location?.county 
                  ? theme.colors.textPrimary 
                  : theme.colors.textTertiary 
              }
            ]}
          >
            {formData.location?.county || 'Selectează județul'}
          </Text>
          <ChevronDown size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {showCountyPicker && (
          <Card style={{...styles.pickerDropdown, backgroundColor: theme.colors.surface}}>
            {COUNTIES.map((county) => (
              <TouchableOpacity
                key={county}
                style={[
                  styles.pickerOption,
                  formData.location?.county === county && { 
                    backgroundColor: `${theme.colors.primary.main}10` 
                  }
                ]}
                onPress={() => {
                  updateLocation({ county, city: '' });
                  setShowCountyPicker(false);
                }}
              >
                <Text 
                  style={[
                    styles.pickerOptionText,
                    { 
                      color: formData.location?.county === county 
                        ? theme.colors.primary.main 
                        : theme.colors.textPrimary 
                    }
                  ]}
                >
                  {county}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </View>

      {/* City Selector */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Oraș / Cartier *
        </Text>
        <TouchableOpacity
          style={[
            styles.selector,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => setShowCityPicker(!showCityPicker)}
          disabled={!formData.location?.county}
        >
          <MapPin size={20} color={theme.colors.textSecondary} />
          <Text 
            style={[
              styles.selectorText, 
              { 
                color: formData.location?.city 
                  ? theme.colors.textPrimary 
                  : theme.colors.textTertiary 
              }
            ]}
          >
            {formData.location?.city || 'Selectează orașul'}
          </Text>
          <ChevronDown size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {showCityPicker && formData.location?.county && (
          <Card style={{...styles.pickerDropdown, backgroundColor: theme.colors.surface}}>
            {(CITIES[formData.location.county] || []).map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.pickerOption,
                  formData.location?.city === city && { 
                    backgroundColor: `${theme.colors.primary.main}10` 
                  }
                ]}
                onPress={() => {
                  updateLocation({ city });
                  setShowCityPicker(false);
                }}
              >
                <Text 
                  style={[
                    styles.pickerOptionText,
                    { 
                      color: formData.location?.city === city 
                        ? theme.colors.primary.main 
                        : theme.colors.textPrimary 
                    }
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </View>

      {/* Street Address */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Stradă (opțional)
        </Text>
        <Input
          value={formData.location?.street || ''}
          onChangeText={(street: string) => updateLocation({ street })}
          placeholder="Ex: Strada Victoriei"
          leftIcon={<MapPin size={20} color={theme.colors.textSecondary} />}
        />
      </View>

      {/* Street Number */}
      <View style={styles.row}>
        <View style={[styles.fieldContainer, { flex: 1 }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Număr
          </Text>
          <Input
            value={formData.location?.streetNumber || ''}
            onChangeText={(streetNumber: string) => updateLocation({ streetNumber })}
            placeholder="Nr."
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.fieldContainer, { flex: 1 }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Bloc
          </Text>
          <Input
            value={formData.location?.building || ''}
            onChangeText={(building: string) => updateLocation({ building })}
            placeholder="Bloc"
          />
        </View>
        <View style={[styles.fieldContainer, { flex: 1 }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Apartament
          </Text>
          <Input
            value={formData.location?.apartment || ''}
            onChangeText={(apartment: string) => updateLocation({ apartment })}
            placeholder="Ap."
          />
        </View>
      </View>

      {/* Map Preview Placeholder */}
      <View style={styles.mapContainer}>
        <View 
          style={[
            styles.mapPlaceholder, 
            { 
              backgroundColor: theme.colors.divider,
              borderColor: theme.colors.border,
            }
          ]}
        >
          <MapPin size={32} color={theme.colors.textTertiary} />
          <Text style={[styles.mapText, { color: theme.colors.textTertiary }]}>
            Selectează locația pe hartă
          </Text>
        </View>
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
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  currentLocationText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  fieldContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  pickerDropdown: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    borderRadius: 12,
    paddingVertical: 8,
    zIndex: 100,
    maxHeight: 250,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerOptionText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  mapContainer: {
    marginTop: 24,
  },
  mapPlaceholder: {
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default LocationStep;
