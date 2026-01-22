/**
 * IMOBI - Edit Property Screen
 * Reuses the CreatePropertyWizard for editing existing properties
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, X, Save } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ProgressBar } from '@/shared/components/ProgressBar';
import Button from '@/shared/components/Button';
import { ProfileStackParamList } from '@/app/navigation/types';
import { 
  usePropertyDetail, 
  useUpdateProperty, 
  useUploadPropertyPhotos 
} from '@/features/properties/hooks/useProperties';
import { IPropertyListing } from '@/core/api/types';

// Import Steps
import PropertyTypeStep from './steps/PropertyTypeStep';
import LocationStep from './steps/LocationStep';
import CharacteristicsStep from './steps/CharacteristicsStep';
import PhotosStep from './steps/PhotosStep';
import PricingStep from './steps/PricingStep';
import PreviewStep from './steps/PreviewStep';

// Types from CreatePropertyWizard
import { PropertyFormData } from './CreatePropertyWizard';

// ============================================
// TYPES
// ============================================

type EditPropertyRouteProp = RouteProp<ProfileStackParamList, 'EditProperty'>;

const STEP_TITLES = [
  'Tip proprietate',
  'Locație',
  'Caracteristici',
  'Fotografii',
  'Preț și descriere',
  'Previzualizare',
];


// ============================================
// COMPONENT
// ============================================

const EditPropertyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<EditPropertyRouteProp>();
  const scrollViewRef = useRef<ScrollView>(null);

  const { propertyId } = route.params;

  // API Hooks
  const { data: property, isLoading: isQueryLoading } = usePropertyDetail(propertyId);
  const updatePropertyMutation = useUpdateProperty();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const totalSteps = 6;

  // Populate form data when property is loaded
  useEffect(() => {
    if (property && !formData) {
      setFormData({
        transactionType: property.transactionType as any,
        propertyType: property.propertyType || 'APARTMENT', 
        location: {
          country: 'România', // Default
          county: property.city, // Assuming city acts as main location for now
          city: property.city,
          neighborhood: property.neighborhood,
          street: property.address?.street,
          streetNumber: property.address?.number,
          building: property.address?.building,
          floor: property.floor,
          apartment: property.address?.apartment,
          coordinates: property.coordinates,
        },
        characteristics: {
          totalArea: property.surface,
          usableArea: property.surface, // fallback
          rooms: property.rooms,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          balconies: property.balconies,
          yearBuilt: property.yearBuilt,
          floor: property.floor,
          totalFloors: property.totalFloors,
          orientation: [], // Not always in listing
          amenities: property.amenities || [],
          utilities: [], // Not always in listing
          comfort: '',
          parking: {
            type: property.parkingType || 'none',
            spots: property.parkingSpots,
          },
        },
        photos: (property.photos || []).map((p: any) => ({
          id: String(p.id),
          uri: p.url,
          isPrimary: p.isPrimary,
          caption: p.caption
        })),
        pricing: {
          price: property.price,
          currency: property.currency as any,
          negotiable: property.isNegotiable,
        },
        title: property.title,
        description: property.description,
      });
    }
  }, [property]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Modificări nesalvate',
        'Ai modificări nesalvate. Ce vrei să faci?',
        [
          { text: 'Continuă editarea', style: 'cancel' },
          {
            text: 'Salvează și ieși',
            onPress: handleSaveAndExit,
          },
          {
            text: 'Renunță',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSaveAndExit = async () => {
    await handleSubmit(true);
  };

  const handleSubmit = async (exitAfter = false) => {
    if (!formData) return;
    
    setIsSubmitting(true);
    try {
      // Map to API DTO
      const apiData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.pricing?.price),
        currency: formData.pricing?.currency,
        city: formData.location?.city,
        neighborhood: formData.location?.neighborhood,
        rooms: Number(formData.characteristics?.rooms || 0),
        surface: Number(formData.characteristics?.totalArea || 0),
        transactionType: formData.transactionType || 'SALE',
        propertyType: formData.propertyType || 'APARTMENT',
        // Optional params
        floor: formData.location?.floor,
        totalFloors: formData.characteristics?.totalFloors,
        yearBuilt: formData.characteristics?.yearBuilt,
        amenities: formData.characteristics?.amenities,
      };

      await updatePropertyMutation.mutateAsync({
        id: propertyId,
        data: apiData
      });

      // Photos management would go here (add new ones, remove deleted ones)
      // For now we just update text data

      Alert.alert(
        'Succes', 
        'Anunțul a fost actualizat.', 
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Eroare', 'Nu am putut actualiza anunțul. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    if (formData) {
      setFormData((prev) => prev ? { ...prev, ...updates } : prev);
      setHasChanges(true);
    }
  };

  const canProceed = (): boolean => {
    if (!formData) return false;
    
    switch (currentStep) {
      case 1:
        return !!formData.transactionType && !!formData.propertyType;
      case 2:
        return !!formData.location?.city;
      case 3:
        return !!formData.characteristics?.totalArea;
      case 4:
        return formData.photos.length >= 3;
      case 5:
        return !!formData.pricing?.price && formData.title.length > 10;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    if (!formData) return null;

    switch (currentStep) {
      case 1:
        return (
          <PropertyTypeStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <LocationStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <CharacteristicsStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <PhotosStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 5:
        return (
          <PricingStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 6:
        return (
          <PreviewStep
            formData={formData}
            onEditStep={(step) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  if (isQueryLoading && !formData) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Se încarcă datele...
        </Text>
      </SafeAreaView>
    );
  }

  if (!property && !isQueryLoading) {
    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text>Proprietatea nu a fost găsită.</Text>
            <Button title="Înapoi" onPress={() => navigation.goBack()} />
        </View>
    );
  }

  if (!formData) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            {STEP_TITLES[currentStep - 1]}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.accent.main }]}>
            Editare • Pasul {currentStep} din {totalSteps}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <X size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          showLabel={false}
          height={4}
        />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        {/* Quick Save Button */}
        {hasChanges && currentStep < totalSteps && (
          <TouchableOpacity
            style={[styles.quickSaveButton, { borderColor: theme.colors.accent.main }]}
            onPress={handleSaveAndExit}
          >
            <Save size={18} color={theme.colors.accent.main} />
          </TouchableOpacity>
        )}

        {currentStep > 1 && (
          <Button
            title="Înapoi"
            variant="secondary"
            onPress={handleBack}
            style={styles.footerButtonSecondary}
          />
        )}

        {currentStep < totalSteps ? (
          <Button
            title="Continuă"
            onPress={handleNext}
            disabled={!canProceed()}
            style={styles.footerButtonPrimary}
          />
        ) : (
          <Button
            title="Actualizează anunțul"
            onPress={() => handleSubmit(true)}
            loading={isSubmitting}
            style={styles.footerButtonPrimary}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  quickSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerButtonSecondary: {
    flex: 1,
  },
  footerButtonPrimary: {
    flex: 2,
  },
});

export default EditPropertyScreen;
