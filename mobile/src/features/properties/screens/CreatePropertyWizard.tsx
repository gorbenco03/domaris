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
import { ArrowLeft, X, CheckCircle, ShieldCheck, Upload, Lock } from 'lucide-react-native';
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
import { useMonetizationStatus } from '@/features/monetization/hooks/usePayments';

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

  // Step 6: Ownership document (optional)
  ownershipDoc: {
    uri: string;
    name: string;
    mimeType: string;
  } | null;
  ownershipDocType: 'PROPERTY_DEED' | 'UTILITY_BILL' | 'RENTAL_CONTRACT' | 'POWER_OF_ATTORNEY' | 'OTHER' | null;
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
  ownershipDoc: null,
  ownershipDocType: null,
};

const DOC_TYPE_LABELS: Record<string, string> = {
  PROPERTY_DEED: 'Act de proprietate',
  UTILITY_BILL: 'Factură utilități',
  RENTAL_CONTRACT: 'Contract de închiriere',
  POWER_OF_ATTORNEY: 'Procură',
  OTHER: 'Alt document',
};

const STEP_TITLES = [
  'Tip proprietate',
  'Locație',
  'Caracteristici',
  'Fotografii',
  'Preț și descriere',
  'Verificare proprietate',
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

  const totalSteps = 7;

  // Monetization: check listing limit and get photo limit
  const {
    canCreateListing,
    status: monetizationStatus,
    isLoading: monetizationLoading,
  } = useMonetizationStatus();

  const maxPhotos = monetizationStatus?.capabilities?.maxPhotosPerListing || 5;

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

  // Wait for monetization data before showing the wizard
  if (monetizationLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              Se verifică...
            </Text>
          </View>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.limitBlockedContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  // Show upgrade prompt if listing limit reached
  if (!canCreateListing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              Limită atinsă
            </Text>
          </View>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.limitBlockedContainer}>
          <View style={[styles.limitBlockedIcon, { backgroundColor: theme.colors.secondary.warning + '20' }]}>
            <Lock size={40} color={theme.colors.secondary.warning} />
          </View>
          <Text style={[styles.limitBlockedTitle, { color: theme.colors.textPrimary }]}>
            Ai atins limita de anunțuri
          </Text>
          <Text style={[styles.limitBlockedDesc, { color: theme.colors.textSecondary }]}>
            Planul tău actual permite maxim{' '}
            {monetizationStatus?.capabilities?.maxActiveListings || 1} anunțuri active.
            Fă upgrade pentru a publica mai multe.
          </Text>
          <Button
            title="Vezi planurile"
            onPress={() => {
              navigation.goBack();
              (navigation as any).navigate('Pricing');
            }}
            style={{ marginTop: 24, width: '100%' }}
          />
          <Button
            title="Înapoi"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12, width: '100%' }}
          />
        </View>
      </SafeAreaView>
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

      // 4. Upload ownership document if provided
      if (formData.ownershipDoc && formData.ownershipDocType) {
        try {
          const docFormData = new FormData();
          docFormData.append('document', {
            uri: formData.ownershipDoc.uri,
            name: formData.ownershipDoc.name,
            type: formData.ownershipDoc.mimeType,
          } as any);
          docFormData.append('docType', formData.ownershipDocType);

          await uploadOwnershipDocMutation.mutateAsync({
            propertyId: newProperty.id,
            formData: docFormData,
          });
        } catch (docError) {
          console.warn('Ownership doc upload failed, property still created:', docError);
        }
      }

      // Transition to success screen
      setCurrentStep(8);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      console.error('Create property error:', error);
      Alert.alert('Eroare', 'Nu am putut publica anunțul. Verifică conexiunea și încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      updateFormData({
        ownershipDoc: {
          uri: file.uri,
          name: file.name || 'document.pdf',
          mimeType: file.mimeType || 'application/pdf',
        },
      });
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Eroare', 'Nu am putut selecta documentul.');
    }
  };

  const handleRemoveDocument = () => {
    updateFormData({ ownershipDoc: null, ownershipDocType: null });
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
        // Ownership doc is optional; if doc is selected, docType must also be set
        return !formData.ownershipDoc || !!formData.ownershipDocType;
      case 7:
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
            maxPhotos={maxPhotos}
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
          <View style={styles.ownershipStepContainer}>
            <View style={styles.ownershipHeader}>
              <ShieldCheck size={24} color={theme.colors.primary.main} />
              <Text style={[styles.ownershipTitle, { color: theme.colors.textPrimary }]}>
                Verificare proprietate
              </Text>
            </View>
            <Text style={[styles.ownershipDesc, { color: theme.colors.textSecondary }]}>
              Încarcă un document care dovedește că ești proprietarul. Anunțul tău va primi un badge de „Proprietate verificată" după aprobarea echipei noastre.
            </Text>

            <Text style={[styles.ownershipNote, { color: theme.colors.textTertiary, marginBottom: 16 }]}>
              Acest pas este opțional — poți sări peste el.
            </Text>

            {/* Document type selector */}
            <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
              Tip document
            </Text>
            <View style={styles.docTypeGrid}>
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => {
                const isSelected = formData.ownershipDocType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.docTypeChip,
                      {
                        borderColor: isSelected ? theme.colors.primary.main : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primary.main + '15' : theme.colors.surface,
                      },
                    ]}
                    onPress={() => updateFormData({ ownershipDocType: key as any })}
                  >
                    <Text
                      style={[
                        styles.docTypeChipText,
                        { color: isSelected ? theme.colors.primary.main : theme.colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Upload area */}
            <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary, marginTop: 20 }]}>
              Document
            </Text>
            {formData.ownershipDoc ? (
              <View style={[styles.docSelectedBanner, { backgroundColor: theme.colors.accent.main + '10', borderColor: theme.colors.accent.main + '40' }]}>
                <CheckCircle size={20} color={theme.colors.accent.main} />
                <Text style={[styles.docSelectedText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {formData.ownershipDoc.name}
                </Text>
                <TouchableOpacity onPress={handleRemoveDocument}>
                  <X size={18} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadDocButton, { borderColor: theme.colors.primary.main }]}
                onPress={handlePickDocument}
              >
                <Upload size={20} color={theme.colors.primary.main} />
                <Text style={[styles.uploadDocText, { color: theme.colors.primary.main }]}>
                  Selectează document
                </Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.uploadHint, { color: theme.colors.textTertiary }]}>
              Formate acceptate: PDF, JPG, PNG. Max 10 MB.
            </Text>
          </View>
        );
      case 7:
        return (
          <PreviewStep
            formData={formData}
            onEditStep={(step) => setCurrentStep(step)}
          />
        );
      case 8:
        return (
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.accent.main + '20' }]}>
              <CheckCircle size={48} color={theme.colors.accent.main} />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>
              Anunțul a fost publicat!
            </Text>
            <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
              {formData.ownershipDoc
                ? 'Anunțul tău este vizibil. Documentul de proprietate va fi verificat de echipa noastră.'
                : 'Anunțul tău este acum vizibil pentru toți utilizatorii.'}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  // Success screen (step 8) has its own layout
  if (currentStep === 8) {
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
  // Ownership step styles
  ownershipStepContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 10,
  },
  docTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docTypeChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  docTypeChipText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  docSelectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  docSelectedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  uploadHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
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
  ownershipNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  // Limit blocked styles
  limitBlockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  limitBlockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  limitBlockedTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  limitBlockedDesc: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CreatePropertyWizard;
