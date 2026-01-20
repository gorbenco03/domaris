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

// Mock function to fetch property data
const fetchPropertyData = async (propertyId: string): Promise<PropertyFormData> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return mock data
  return {
    transactionType: 'SALE',
    propertyType: 'APARTMENT',
    location: {
      country: 'România',
      county: 'București',
      city: 'București',
      neighborhood: 'Drumul Taberei',
      street: 'Strada Brasov',
      streetNumber: '15',
      building: 'A',
      floor: 3,
      apartment: '12',
      coordinates: {
        latitude: 44.4268,
        longitude: 26.1025,
      },
    },
    characteristics: {
      totalArea: 75,
      usableArea: 68,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      balconies: 1,
      yearBuilt: 2015,
      floor: 3,
      totalFloors: 10,
      orientation: ['SUD', 'EST'],
      amenities: ['aer_conditionat', 'centrala_termica', 'parcare'],
      utilities: ['curent', 'apa', 'gaz', 'canalizare'],
      comfort: 'clasa_1',
      parking: {
        type: 'subteran',
        spots: 1,
      },
    },
    photos: [
      { id: '1', uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', isPrimary: true, caption: 'Living' },
      { id: '2', uri: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', isPrimary: false, caption: 'Dormitor' },
      { id: '3', uri: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400', isPrimary: false, caption: 'Bucatarie' },
    ],
    pricing: {
      price: 120000,
      currency: 'EUR',
      negotiable: true,
    },
    title: 'Apartament 3 camere, Drumul Taberei - renovat complet',
    description: 'Apartament spațios cu 3 camere, complet renovat în 2023. Situat la etajul 3 din 10, cu vedere panoramică spre parc. Include loc de parcare subteran și boxă.',
  };
};

// ============================================
// COMPONENT
// ============================================

const EditPropertyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<EditPropertyRouteProp>();
  const scrollViewRef = useRef<ScrollView>(null);

  const { propertyId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const totalSteps = 6;

  useEffect(() => {
    loadPropertyData();
  }, [propertyId]);

  const loadPropertyData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPropertyData(propertyId);
      setFormData(data);
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut încărca datele proprietății.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

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
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Succes!', 'Modificările au fost salvate.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut salva modificările. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert(
        'Succes',
        'Anunțul tău a fost actualizat și va fi vizibil după verificare.',
        [
          {
            text: 'Super!',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
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

  if (isLoading) {
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

  if (!formData) {
    return null;
  }

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
            onPress={handleSubmit}
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
