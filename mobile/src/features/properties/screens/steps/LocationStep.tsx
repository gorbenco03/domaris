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
// LOCATION DATA - Moldova
// ============================================

// All regions (raioane) of Moldova
const REGIONS: string[] = [
  'Chișinău', 'Bălți', 'Cahul', 'Ungheni', 'Orhei', 'Soroca',
  'Edineț', 'Comrat', 'Strășeni', 'Hîncești', 'Ialoveni', 'Criuleni',
  'Căușeni', 'Florești', 'Anenii Noi', 'Telenești', 'Sîngerei', 'Rîșcani',
  'Briceni', 'Ocnița', 'Dondușeni', 'Drochia', 'Glodeni', 'Fălești',
  'Nisporeni', 'Călărași', 'Rezina', 'Șoldănești', 'Dubăsari',
  'Ștefan Vodă', 'Cimișlia', 'Basarabeasca', 'Leova', 'Cantemir', 'Taraclia',
];

// Cities/towns per region
const CITIES: Record<string, string[]> = {
  'Chișinău': ['Chișinău'],
  'Bălți': ['Bălți'],
  'Cahul': ['Cahul', 'Vulcănești'],
  'Ungheni': ['Ungheni', 'Cornești'],
  'Orhei': ['Orhei'],
  'Soroca': ['Soroca'],
  'Edineț': ['Edineț', 'Cupcini'],
  'Comrat': ['Comrat', 'Ceadîr-Lunga'],
  'Strășeni': ['Strășeni'],
  'Hîncești': ['Hîncești'],
  'Ialoveni': ['Ialoveni'],
  'Criuleni': ['Criuleni'],
  'Căușeni': ['Căușeni'],
  'Florești': ['Florești'],
  'Anenii Noi': ['Anenii Noi'],
  'Telenești': ['Telenești'],
  'Sîngerei': ['Sîngerei'],
  'Rîșcani': ['Rîșcani'],
  'Briceni': ['Briceni'],
  'Ocnița': ['Ocnița'],
  'Dondușeni': ['Dondușeni'],
  'Drochia': ['Drochia'],
  'Glodeni': ['Glodeni'],
  'Fălești': ['Fălești'],
  'Nisporeni': ['Nisporeni'],
  'Călărași': ['Călărași'],
  'Rezina': ['Rezina'],
  'Șoldănești': ['Șoldănești'],
  'Dubăsari': ['Dubăsari'],
  'Ștefan Vodă': ['Ștefan Vodă'],
  'Cimișlia': ['Cimișlia'],
  'Basarabeasca': ['Basarabeasca'],
  'Leova': ['Leova'],
  'Cantemir': ['Cantemir'],
  'Taraclia': ['Taraclia'],
};

// Neighborhoods for cities that have defined sectors/neighborhoods
const NEIGHBORHOODS: Record<string, string[]> = {
  'Chișinău': ['Centru', 'Botanica', 'Buiucani', 'Ciocana', 'Rîșcani'],
  'Bălți': ['Centru', 'Dacia', 'Slobozia', 'Pământeni'],
};

// Helper to check if a city has defined neighborhoods
const getCityNeighborhoods = (city: string): string[] | null => {
  return NEIGHBORHOODS[city] || null;
};

// ============================================
// COMPONENT
// ============================================

const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  updateFormData,
}) => {
  const { theme } = useTheme();
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false);

  const selectedRegion = formData.location?.county || '';
  const selectedCity = formData.location?.city || '';
  
  // Get available neighborhoods for selected city
  const availableNeighborhoods = getCityNeighborhoods(selectedCity);
  const hasNeighborhoods = availableNeighborhoods && availableNeighborhoods.length > 0;

  const closeAllPickers = () => {
    setShowRegionPicker(false);
    setShowCityPicker(false);
    setShowNeighborhoodPicker(false);
  };

  const updateLocation = (updates: Partial<NonNullable<PropertyFormData['location']>>) => {
    updateFormData({
      location: {
        country: 'Moldova',
        county: '',
        city: '',
        ...formData.location,
        ...updates,
      },
    });
  };

  const handleRegionSelect = (region: string) => {
    const cities = CITIES[region] || [];
    
    // If region has only one city with same name, auto-select it
    if (cities.length === 1 && cities[0] === region) {
      updateLocation({ 
        county: region, 
        city: region, 
        neighborhood: undefined 
      });
    } else {
      updateLocation({ 
        county: region, 
        city: '', 
        neighborhood: undefined 
      });
    }
    closeAllPickers();
  };

  const handleCitySelect = (city: string) => {
    updateLocation({ city, neighborhood: undefined });
    closeAllPickers();
  };

  const handleNeighborhoodSelect = (neighborhood: string) => {
    updateLocation({ neighborhood });
    closeAllPickers();
  };

  const handleUseCurrentLocation = () => {
    // In a real app, this would use GPS
    updateLocation({
      country: 'Moldova',
      county: 'Chișinău',
      city: 'Chișinău',
      neighborhood: 'Centru',
      coordinates: {
        latitude: 47.0105,
        longitude: 28.8638,
      },
    });
  };

  // Get cities for current selection
  const availableCities = CITIES[selectedRegion] || [];
  // Check if we should show city picker (hide if only one city with same name as region)
  const shouldShowCityPicker = !(availableCities.length === 1 && availableCities[0] === selectedRegion);

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

      {/* Region/Raion Selector */}
      <View style={[styles.fieldContainer, showRegionPicker && styles.fieldContainerActive]}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Raion *
        </Text>
        <TouchableOpacity
          style={[
            styles.selector,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => {
            closeAllPickers();
            setShowRegionPicker(!showRegionPicker);
          }}
        >
          <MapPin size={20} color={theme.colors.textSecondary} />
          <Text 
            style={[
              styles.selectorText, 
              { 
                color: selectedRegion 
                  ? theme.colors.textPrimary 
                  : theme.colors.textTertiary 
              }
            ]}
          >
            {selectedRegion || 'Selectează raionul'}
          </Text>
          <ChevronDown size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {showRegionPicker && (
          <Card
            style={[
              styles.pickerDropdown,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region}
                style={[
                  styles.pickerOption,
                  selectedRegion === region && { 
                    backgroundColor: `${theme.colors.primary.main}10` 
                  }
                ]}
                onPress={() => handleRegionSelect(region)}
              >
                <Text 
                  style={[
                    styles.pickerOptionText,
                    { 
                      color: selectedRegion === region 
                        ? theme.colors.primary.main 
                        : theme.colors.textPrimary 
                    }
                  ]}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </View>

      {/* City Selector - only show if region has multiple cities */}
      {shouldShowCityPicker && (
        <View style={[styles.fieldContainer, showCityPicker && styles.fieldContainerActive]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Oraș *
          </Text>
          <TouchableOpacity
            style={[
              styles.selector,
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => {
              closeAllPickers();
              setShowCityPicker(!showCityPicker);
            }}
            disabled={!selectedRegion}
          >
            <MapPin size={20} color={theme.colors.textSecondary} />
            <Text 
              style={[
                styles.selectorText, 
                { 
                  color: selectedCity 
                    ? theme.colors.textPrimary 
                    : theme.colors.textTertiary 
                }
              ]}
            >
              {selectedCity || 'Selectează orașul'}
            </Text>
            <ChevronDown size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {showCityPicker && selectedRegion && (
            <Card
              style={[
                styles.pickerDropdown,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {availableCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.pickerOption,
                    selectedCity === city && { 
                      backgroundColor: `${theme.colors.primary.main}10` 
                    }
                  ]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text 
                    style={[
                      styles.pickerOptionText,
                      { 
                        color: selectedCity === city 
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
      )}

      {/* Neighborhood Selector - only show for cities with defined neighborhoods (București, Chișinău) */}
      {hasNeighborhoods && (
        <View style={[styles.fieldContainer, showNeighborhoodPicker && styles.fieldContainerActive]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Sector / Cartier *
          </Text>
          <TouchableOpacity
            style={[
              styles.selector,
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => {
              closeAllPickers();
              setShowNeighborhoodPicker(!showNeighborhoodPicker);
            }}
            disabled={!selectedCity}
          >
            <MapPin size={20} color={theme.colors.textSecondary} />
            <Text 
              style={[
                styles.selectorText, 
                { 
                  color: formData.location?.neighborhood 
                    ? theme.colors.textPrimary 
                    : theme.colors.textTertiary 
                }
              ]}
            >
              {formData.location?.neighborhood || 'Selectează sectorul/cartierul'}
            </Text>
            <ChevronDown size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {showNeighborhoodPicker && selectedCity && (
            <Card
              style={[
                styles.pickerDropdown,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {availableNeighborhoods?.map((neighborhood) => (
                <TouchableOpacity
                  key={neighborhood}
                  style={[
                    styles.pickerOption,
                    formData.location?.neighborhood === neighborhood && { 
                      backgroundColor: `${theme.colors.primary.main}10` 
                    }
                  ]}
                  onPress={() => handleNeighborhoodSelect(neighborhood)}
                >
                  <Text 
                    style={[
                      styles.pickerOptionText,
                      { 
                        color: formData.location?.neighborhood === neighborhood 
                          ? theme.colors.primary.main 
                          : theme.colors.textPrimary 
                      }
                    ]}
                  >
                    {neighborhood}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </View>
      )}

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
    overflow: 'visible',
  },
  fieldContainerActive: {
    zIndex: 30,
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
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 12,
    paddingVertical: 8,
    zIndex: 100,
    maxHeight: 250,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
