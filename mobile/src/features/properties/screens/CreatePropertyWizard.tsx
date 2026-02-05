/**
 * RIVA - Create Property Wizard Screen
 * Multi-step property creation wizard
 */

import React, { useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, X, CheckCircle, ShieldCheck, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import ProgressBar from '@/shared/components/ProgressBar';
import Button from '@/shared/components/Button';
import { AuthRequiredScreen, IconButton } from '@/shared/components';
import {
  useCreateProperty,
  useUploadPropertyPhotos,
  useUploadOwnershipDoc,
  ICreatePropertyRequest,
} from '@/features/properties/services';

// Import Steps
import PropertyTypeStep from './steps/PropertyTypeStep';
import LocationStep from './steps/LocationStep';
import CharacteristicsStep from './steps/CharacteristicsStep';
import PhotosStep from './steps/PhotosStep';
import PricingStep from './steps/PricingStep';
import PreviewStep from './steps/PreviewStep';

// ============================================
// TYPES
// ============================================

export interface PropertyFormData {
  // Step 1: Type
  transactionType: 'SALE' | 'RENT' | null;
  propertyType: string | null;
  
  // Step 2: Location
  location: {
    country: string;
    county: string;
    city: string;
    neighborhood?: string;
    street?: string;
    streetNumber?: string;
    building?: string;
    floor?: number;
    apartment?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  } | null;
  
  // Step 3: Characteristics
  characteristics: {
    totalArea: number;
    usableArea?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    yearBuilt?: number;
    floor?: number;
    totalFloors?: number;
    orientation?: string[];
    amenities: string[];
    utilities: string[];
    comfort?: string;
    parking?: {
      type: string;
      spots?: number;
    };
  } | null;
  
  // Step 4: Photos
  photos: {
    id: string;
    uri: string;
    isPrimary: boolean;
    caption?: string;
  }[];
  
  // Step 5: Pricing & Description
  pricing: {
    price: number;
    currency: 'EUR' | 'RON';
    negotiable: boolean;
    rentDetails?: {
      depositMonths: number;
      utilitiesIncluded: boolean;
      minimumPeriodMonths?: number;
    };
  } | null;
  title: string;
  description: string;
}

const INITIAL_FORM_DATA: PropertyFormData = {
  transactionType: null,
  propertyType: null,
  location: null,
  characteristics: null,
  photos: [],
  pricing: null,
  title: '',
  description: '',
};

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

const CreatePropertyWizard: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<number | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false);

  const totalSteps = 6;

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Închide',
      'Ești sigur că vrei să închizi? Datele introduse vor fi salvate ca draft.',
      [
        { text: 'Continuă editarea', style: 'cancel' },
        { 
          text: 'Salvează draft', 
          onPress: () => navigation.goBack() 
        },
      ]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  /* API Hooks */
  const createPropertyMutation = useCreateProperty();
  const uploadPhotosMutation = useUploadPropertyPhotos();
  const uploadOwnershipDocMutation = useUploadOwnershipDoc();

  if (!isAuthenticated) {
    return (
      <AuthRequiredScreen message="Autentifică-te pentru a putea posta anunțuri." />
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Map Form Data to API Request DTO
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
        // Optional fields mapping
        floor: formData.characteristics?.floor,
        totalFloors: formData.characteristics?.totalFloors,
        bathrooms: formData.characteristics?.bathrooms,
        yearBuilt: formData.characteristics?.yearBuilt,
        partitioning: formData.characteristics?.comfort,
        amenities: formData.characteristics?.amenities,
        utilities: formData.characteristics?.utilities,
        street: formData.location?.street,
        streetNumber: formData.location?.streetNumber,
        building: formData.location?.building,
        // Coordinates - IMPORTANT: lat is latitude, lng is longitude
        lat: formData.location?.coordinates?.latitude,
        lng: formData.location?.coordinates?.longitude,
        locationSetManually: !!(formData.location?.coordinates?.latitude && formData.location?.coordinates?.longitude),
      };

      // 2. Create Property
      console.log('[CreatePropertyWizard] API Data:', JSON.stringify(apiData, null, 2));
      const newProperty = await createPropertyMutation.mutateAsync(apiData as any); 
      console.log('[CreatePropertyWizard] New Property created:', JSON.stringify(newProperty, null, 2));
      
      // 3. Upload Photos if any
      if (formData.photos.length > 0) {
        const photoFormData = new FormData();
        
        formData.photos.forEach((photo) => {
          // React Native FormData expects: { uri, name, type }
          const filename = photo.uri.split('/').pop() || 'photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          photoFormData.append('photos', {
            uri: photo.uri,
            name: filename,
            type,
          } as any);
        });

        await uploadPhotosMutation.mutateAsync({
          propertyId: newProperty.id,
          formData: photoFormData,
        });
      }

      // Transition to success/ownership doc step
      setCreatedPropertyId(newProperty.id);
      setCurrentStep(7);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      console.error('Create property error:', error);
      Alert.alert('Eroare', 'Nu am putut publica anunțul. Verifică conexiunea și încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadOwnershipDoc = async () => {
    if (!createdPropertyId) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      setIsUploadingDoc(true);

      const docFormData = new FormData();
      docFormData.append('document', {
        uri: file.uri,
        name: file.name || 'document.pdf',
        type: file.mimeType || 'application/pdf',
      } as any);
      docFormData.append('docType', 'PROPERTY_DEED');

      await uploadOwnershipDocMutation.mutateAsync({
        propertyId: createdPropertyId,
        formData: docFormData,
      });

      setDocUploaded(true);
    } catch (error) {
      console.error('Upload ownership doc error:', error);
      Alert.alert('Eroare', 'Nu am putut încărca documentul. Poți încerca din nou mai târziu din pagina anunțului.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
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
      case 7:
        return (
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.accent.main + '20' }]}>
              <CheckCircle size={48} color={theme.colors.accent.main} />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>
              Anunțul a fost publicat!
            </Text>
            <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
              Anunțul tău este acum vizibil pentru toți utilizatorii.
            </Text>

            {/* Ownership doc section */}
            <View style={[styles.ownershipSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.ownershipHeader}>
                <ShieldCheck size={22} color={theme.colors.primary.main} />
                <Text style={[styles.ownershipTitle, { color: theme.colors.textPrimary }]}>
                  Verifică proprietatea
                </Text>
              </View>
              <Text style={[styles.ownershipDesc, { color: theme.colors.textSecondary }]}>
                Încarcă un document care dovedește că ești proprietarul (act de proprietate, factură utilități, contract de închiriere).
                Anunțul tău va primi un badge de „Proprietate verificată" după aprobarea de către echipa noastră.
              </Text>

              {docUploaded ? (
                <View style={[styles.docUploadedBanner, { backgroundColor: theme.colors.accent.main + '15' }]}>
                  <CheckCircle size={20} color={theme.colors.accent.main} />
                  <Text style={[styles.docUploadedText, { color: theme.colors.accent.main }]}>
                    Document încărcat! Vom verifica și te vom notifica.
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadDocButton, { borderColor: theme.colors.primary.main }]}
                  onPress={handleUploadOwnershipDoc}
                  disabled={isUploadingDoc}
                >
                  {isUploadingDoc ? (
                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                  ) : (
                    <>
                      <Upload size={20} color={theme.colors.primary.main} />
                      <Text style={[styles.uploadDocText, { color: theme.colors.primary.main }]}>
                        Încarcă document
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text style={[styles.ownershipNote, { color: theme.colors.textTertiary }]}>
                Opțional — poți face asta oricând din pagina anunțului.
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Success screen (step 7) has its own layout
  if (currentStep === 7) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
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

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Button
            title="Gata"
            onPress={() => navigation.goBack()}
            style={styles.footerButtonPrimary}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <IconButton
          icon={<ArrowLeft size={22} color={theme.colors.textPrimary} />}
          onPress={handleBack}
          variant="surface"
          size="md"
          style={[styles.headerButton, { borderWidth: 1, borderColor: theme.colors.border }]}
        />

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            {STEP_TITLES[currentStep - 1]}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textTertiary }]}>
            Pasul {currentStep} din {totalSteps}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClose}
        >
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
          horizontal={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          alwaysBounceHorizontal={false}
          directionalLockEnabled
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
          }
        ]}
      >
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
            title="Publică anunțul"
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
    fontFamily: 'Inter-Regular',
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
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerButtonSecondary: {
    flex: 1,
  },
  footerButtonPrimary: {
    flex: 2,
  },
  // Success screen styles
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  ownershipSection: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  ownershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ownershipTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  ownershipDesc: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  uploadDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  uploadDocText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  docUploadedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  docUploadedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  ownershipNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default CreatePropertyWizard;
