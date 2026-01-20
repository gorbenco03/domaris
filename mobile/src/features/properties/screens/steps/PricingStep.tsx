/**
 * IMOBI - Pricing Step
 * Step 5 of property creation wizard
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { DollarSign, FileText, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import Input from '@/shared/components/Input';
import Checkbox from '@/shared/components/Checkbox';
import Chip from '@/shared/components/Chip';
import Button from '@/shared/components/Button';
import type { PropertyFormData } from '../CreatePropertyWizard';

// ============================================
// TYPES
// ============================================

interface PricingStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

// ============================================
// COMPONENT
// ============================================

const PricingStep: React.FC<PricingStepProps> = ({
  formData,
  updateFormData,
}) => {
  const { theme } = useTheme();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const updatePricing = (updates: Partial<NonNullable<PropertyFormData['pricing']>>) => {
    updateFormData({
      pricing: {
        price: 0,
        currency: 'EUR',
        negotiable: false,
        ...formData.pricing,
        ...updates,
      },
    });
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const generatedDescription = `Apartament modern și spațios, situat într-o zonă liniștită cu acces facil la transport public și facilitități. 

Proprietatea dispune de finisaje de calitate, bucătărie modernă complet utilată și băi cu instalații sanitare premium.

Ideal pentru familii sau tineri profesioniști care caută confort și funcționalitate.

✓ Orientare spre sud - lumină naturală abundentă
✓ Parchet premium în toate camerele
✓ Centrală termică proprie
✓ Loc de parcare inclus`;
    
    updateFormData({ description: generatedDescription });
    setIsGeneratingDescription(false);
  };

  const isRent = formData.transactionType === 'RENT';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Preț și descriere
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Un preț corect și o descriere bună cresc șansele de succes
      </Text>

      {/* Price Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          💰 Preț
        </Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceInputContainer}>
            <Input
              value={formData.pricing?.price?.toString() || ''}
              onChangeText={(val: string) => updatePricing({ price: parseInt(val.replace(/\D/g, '')) || 0 })}
              placeholder="95.000"
              keyboardType="numeric"
              leftIcon={<DollarSign size={20} color={theme.colors.textSecondary} />}
            />
          </View>
          <View style={styles.currencyToggle}>
            <Chip
              label="EUR"
              selected={formData.pricing?.currency === 'EUR'}
              onPress={() => updatePricing({ currency: 'EUR' })}
            />
            <Chip
              label="RON"
              selected={formData.pricing?.currency === 'RON'}
              onPress={() => updatePricing({ currency: 'RON' })}
            />
          </View>
        </View>

        <View style={styles.checkboxContainer}>
          <Checkbox
            checked={formData.pricing?.negotiable || false}
            onChange={() => updatePricing({ negotiable: !formData.pricing?.negotiable })}
            label="Preț negociabil"
          />
        </View>

        {/* Rent specific fields */}
        {isRent && (
          <View style={styles.rentFields}>
            <View style={styles.row}>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Garanție (luni)
                </Text>
                <Input
                  value={formData.pricing?.rentDetails?.depositMonths?.toString() || ''}
                  onChangeText={(val: string) => updatePricing({ 
                    rentDetails: { 
                      ...formData.pricing?.rentDetails,
                      depositMonths: parseInt(val) || 1,
                      utilitiesIncluded: formData.pricing?.rentDetails?.utilitiesIncluded || false,
                    } 
                  })}
                  placeholder="2"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Perioadă min. (luni)
                </Text>
                <Input
                  value={formData.pricing?.rentDetails?.minimumPeriodMonths?.toString() || ''}
                  onChangeText={(val: string) => updatePricing({ 
                    rentDetails: { 
                      ...formData.pricing?.rentDetails,
                      depositMonths: formData.pricing?.rentDetails?.depositMonths || 1,
                      utilitiesIncluded: formData.pricing?.rentDetails?.utilitiesIncluded || false,
                      minimumPeriodMonths: parseInt(val) || undefined,
                    } 
                  })}
                  placeholder="12"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Checkbox
              checked={formData.pricing?.rentDetails?.utilitiesIncluded || false}
              onChange={() => updatePricing({ 
                rentDetails: { 
                  ...formData.pricing?.rentDetails,
                  depositMonths: formData.pricing?.rentDetails?.depositMonths || 1,
                  utilitiesIncluded: !formData.pricing?.rentDetails?.utilitiesIncluded,
                } 
              })}
              label="Utilități incluse în preț"
            />
          </View>
        )}
      </View>

      {/* Title Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          📝 Titlu anunț *
        </Text>
        <Input
          value={formData.title}
          onChangeText={(title: string) => updateFormData({ title })}
          placeholder="Ex: Apartament 3 camere renovat, zona centrală"
          maxLength={100}
        />
        <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
          {formData.title.length}/100 caractere
        </Text>
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <View style={styles.descriptionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            📄 Descriere *
          </Text>
          <TouchableOpacity
            style={[
              styles.aiButton,
              { backgroundColor: theme.colors.secondary.main }
            ]}
            onPress={handleGenerateDescription}
            activeOpacity={0.8}
            disabled={isGeneratingDescription}
          >
            <Sparkles size={16} color="#ffffff" />
            <Text style={styles.aiButtonText}>
              {isGeneratingDescription ? 'Se generează...' : 'Generează cu AI'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View 
          style={[
            styles.descriptionContainer,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
        >
          <TextInput
            value={formData.description}
            onChangeText={(description) => updateFormData({ description })}
            placeholder="Descrie proprietatea ta în detaliu. Include informații despre finisaje, orientare, vecinătăți, facilități..."
            placeholderTextColor={theme.colors.textTertiary}
            style={[styles.descriptionInput, { color: theme.colors.textPrimary }]}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>
        <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
          {formData.description.length}/2000 caractere (minim 100)
        </Text>
      </View>

      {/* Tips */}
      <View 
        style={[
          styles.tipsContainer, 
          { backgroundColor: `${theme.colors.secondary.info}10` }
        ]}
      >
        <Text style={[styles.tipsTitle, { color: theme.colors.secondary.info }]}>
          Sfaturi pentru o descriere bună
        </Text>
        <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
          • Menționează an renovare și tipul finisajelor{'\n'}
          • Descrie vecinătatea (școli, parcuri, transport){'\n'}
          • Evidențiază avantajele unice{'\n'}
          • Fii sincer și evită exagerările
        </Text>
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
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  priceInputContainer: {
    flex: 1,
  },
  currencyToggle: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  checkboxContainer: {
    marginTop: 12,
  },
  rentFields: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 6,
    textAlign: 'right',
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  aiButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  descriptionContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    minHeight: 160,
  },
  descriptionInput: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    flex: 1,
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});

export default PricingStep;
