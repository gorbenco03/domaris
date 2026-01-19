/**
 * IMOBI - Preview Step
 * Step 6 of property creation wizard - Final preview before publishing
 */

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Layers,
  Edit2,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { AIAnalysisWidget } from '@/features/properties/components/AIAnalysisWidget';
import type { PropertyFormData } from '../CreatePropertyWizard';

// ============================================
// TYPES
// ============================================

interface PreviewStepProps {
  formData: PropertyFormData;
  onEditStep: (step: number) => void;
}

// ============================================
// MOCK AI ANALYSIS
// ============================================

const MOCK_AI_ANALYSIS = {
  overallScore: 78,
  pricing: {
    status: 'high' as const,
    currentPrice: 95000,
    recommendedMin: 85000,
    recommendedMax: 92000,
    visibilityImpact: -22,
  },
  description: {
    score: 72,
    missingKeywords: ['an renovare', 'tip încălzire'],
    suggestions: ['Adaugă detalii despre finisaje'],
  },
  photos: {
    count: 8,
    missingRooms: ['bucătărie'],
    qualityIssues: [],
  },
};

// ============================================
// COMPONENT
// ============================================

const PreviewStep: React.FC<PreviewStepProps> = ({
  formData,
  onEditStep,
}) => {
  const { theme } = useTheme();

  const formatPrice = () => {
    if (!formData.pricing) return '-';
    const { price, currency } = formData.pricing;
    const formatted = price.toLocaleString('ro-RO');
    return currency === 'EUR' ? `${formatted} €` : `${formatted} RON`;
  };

  const formatLocation = () => {
    if (!formData.location) return '-';
    const parts = [
      formData.location.neighborhood,
      formData.location.city,
      formData.location.county,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getPropertyTypeLabel = () => {
    const labels: Record<string, string> = {
      APARTMENT: 'Apartament',
      HOUSE: 'Casă/Vilă',
      STUDIO: 'Garsonieră',
      PENTHOUSE: 'Penthouse',
      DUPLEX: 'Duplex',
      LAND: 'Teren',
      COMMERCIAL: 'Comercial',
      OFFICE: 'Birou',
      PARKING: 'Parcare',
      STORAGE: 'Depozit',
    };
    return formData.propertyType ? labels[formData.propertyType] || formData.propertyType : '-';
  };

  const getTransactionLabel = () => {
    return formData.transactionType === 'RENT' ? 'De închiriat' : 'De vânzare';
  };

  const SectionHeader = ({ title, step }: { title: string; step: number }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => onEditStep(step)}
      >
        <Edit2 size={16} color={theme.colors.primary.main} />
        <Text style={[styles.editText, { color: theme.colors.primary.main }]}>
          Editează
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Previzualizare anunț
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Verifică dacă totul este corect înainte de publicare
      </Text>

      {/* AI Analysis */}
      <AIAnalysisWidget
        analysis={MOCK_AI_ANALYSIS}
        onGenerateDescription={() => onEditStep(5)}
        onAdjustPrice={() => onEditStep(5)}
        onAddPhotos={() => onEditStep(4)}
      />

      {/* Photo Preview */}
      <View style={styles.section}>
        <SectionHeader title="📸 Fotografii" step={4} />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosScroll}
        >
          {formData.photos.slice(0, 5).map((photo, index) => (
            <View key={photo.id} style={styles.photoItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              {photo.isPrimary && (
                <View style={[styles.primaryBadge, { backgroundColor: theme.colors.accent.main }]}>
                  <Text style={styles.primaryText}>Principal</Text>
                </View>
              )}
            </View>
          ))}
          {formData.photos.length > 5 && (
            <View 
              style={[
                styles.morePhotos, 
                { backgroundColor: theme.colors.divider }
              ]}
            >
              <Text style={[styles.morePhotosText, { color: theme.colors.textSecondary }]}>
                +{formData.photos.length - 5}
              </Text>
            </View>
          )}
        </ScrollView>
        <Text style={[styles.photoCount, { color: theme.colors.textTertiary }]}>
          {formData.photos.length} fotografii încărcate
        </Text>
      </View>

      {/* Basic Info */}
      <Card style={styles.infoCard}>
        <SectionHeader title="📋 Informații generale" step={1} />
        
        <View style={styles.badgesRow}>
          <Badge 
            label={getTransactionLabel()} 
            variant={formData.transactionType === 'RENT' ? 'accent' : 'primary'} 
          />
          <Badge label={getPropertyTypeLabel()} variant="info" />
        </View>

        <Text style={[styles.propertyTitle, { color: theme.colors.textPrimary }]}>
          {formData.title || 'Fără titlu'}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={16} color={theme.colors.accent.main} />
          <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
            {formatLocation()}
          </Text>
        </View>

        <View style={[styles.priceContainer, { backgroundColor: theme.colors.divider }]}>
          <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
            Preț
          </Text>
          <Text style={[styles.priceValue, { color: theme.colors.primary.main }]}>
            {formatPrice()}
            {formData.transactionType === 'RENT' && (
              <Text style={styles.rentSuffix}>/lună</Text>
            )}
          </Text>
          {formData.pricing?.negotiable && (
            <Badge label="Negociabil" variant="warning" size="sm" />
          )}
        </View>
      </Card>

      {/* Characteristics */}
      <Card style={styles.infoCard}>
        <SectionHeader title="🏠 Caracteristici" step={3} />
        
        <View style={styles.characteristicsGrid}>
          {formData.characteristics?.bedrooms && (
            <View style={styles.characteristicItem}>
              <Bed size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicValue, { color: theme.colors.textPrimary }]}>
                {formData.characteristics.bedrooms}
              </Text>
              <Text style={[styles.characteristicLabel, { color: theme.colors.textTertiary }]}>
                Dormitoare
              </Text>
            </View>
          )}
          {formData.characteristics?.bathrooms && (
            <View style={styles.characteristicItem}>
              <Bath size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicValue, { color: theme.colors.textPrimary }]}>
                {formData.characteristics.bathrooms}
              </Text>
              <Text style={[styles.characteristicLabel, { color: theme.colors.textTertiary }]}>
                Băi
              </Text>
            </View>
          )}
          {formData.characteristics?.totalArea && (
            <View style={styles.characteristicItem}>
              <Maximize2 size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicValue, { color: theme.colors.textPrimary }]}>
                {formData.characteristics.totalArea}
              </Text>
              <Text style={[styles.characteristicLabel, { color: theme.colors.textTertiary }]}>
                m² total
              </Text>
            </View>
          )}
          {formData.characteristics?.floor && (
            <View style={styles.characteristicItem}>
              <Layers size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.characteristicValue, { color: theme.colors.textPrimary }]}>
                {formData.characteristics.floor}/{formData.characteristics.totalFloors}
              </Text>
              <Text style={[styles.characteristicLabel, { color: theme.colors.textTertiary }]}>
                Etaj
              </Text>
            </View>
          )}
        </View>

        {/* Amenities */}
        {formData.characteristics?.amenities && formData.characteristics.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            <Text style={[styles.amenitiesTitle, { color: theme.colors.textSecondary }]}>
              Dotări incluse:
            </Text>
            <View style={styles.amenitiesGrid}>
              {formData.characteristics.amenities.slice(0, 6).map((amenity) => (
                <View key={amenity} style={styles.amenityItem}>
                  <CheckCircle size={14} color={theme.colors.accent.main} />
                  <Text style={[styles.amenityText, { color: theme.colors.textSecondary }]}>
                    {amenity.replace(/_/g, ' ').toLowerCase()}
                  </Text>
                </View>
              ))}
              {formData.characteristics.amenities.length > 6 && (
                <Text style={[styles.moreAmenities, { color: theme.colors.primary.main }]}>
                  +{formData.characteristics.amenities.length - 6} altele
                </Text>
              )}
            </View>
          </View>
        )}
      </Card>

      {/* Description */}
      <Card style={styles.infoCard}>
        <SectionHeader title="📝 Descriere" step={5} />
        <Text 
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={6}
        >
          {formData.description || 'Nu a fost adăugată nicio descriere.'}
        </Text>
      </Card>

      {/* Ready to publish message */}
      <View 
        style={[
          styles.readyContainer, 
          { backgroundColor: `${theme.colors.accent.main}10` }
        ]}
      >
        <CheckCircle size={24} color={theme.colors.accent.main} />
        <View style={styles.readyText}>
          <Text style={[styles.readyTitle, { color: theme.colors.accent.main }]}>
            Gata de publicare!
          </Text>
          <Text style={[styles.readySubtitle, { color: theme.colors.textSecondary }]}>
            Anunțul tău va fi vizibil după o scurtă verificare
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
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  photosScroll: {
    gap: 10,
  },
  photoItem: {
    position: 'relative',
    width: 120,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  morePhotos: {
    width: 80,
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  photoCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  infoCard: {
    marginBottom: 16,
    padding: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  propertyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  priceValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  rentSuffix: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  characteristicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  characteristicItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  characteristicValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  characteristicLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  amenitiesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  amenitiesTitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 10,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  amenityText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
  },
  moreAmenities: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  readyText: {
    flex: 1,
  },
  readyTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  readySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});

export default PreviewStep;
