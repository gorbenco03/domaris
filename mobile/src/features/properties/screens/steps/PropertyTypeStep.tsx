/**
 * IMOBI - Property Type Step
 * Step 1 of property creation wizard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { TransactionTypeToggle } from '@/features/properties/components/TransactionTypeToggle';
import { PropertyTypeSelector } from '@/features/properties/components/PropertyTypeSelector';
import type { PropertyFormData } from '../CreatePropertyWizard';

// ============================================
// TYPES
// ============================================

interface PropertyTypeStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

// ============================================
// COMPONENT
// ============================================

const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({
  formData,
  updateFormData,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Ce dorești să publici?
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Selectează tipul tranzacției și tipul proprietății
      </Text>

      {/* Transaction Type */}
      <View style={styles.section}>
        <TransactionTypeToggle
          value={formData.transactionType || 'SALE'}
          onChange={(type) => updateFormData({ transactionType: type })}
        />
      </View>

      {/* Property Type */}
      <View style={styles.section}>
        <PropertyTypeSelector
          selectedType={formData.propertyType as any}
          onSelect={(type) => updateFormData({ propertyType: type })}
          transactionType={formData.transactionType || 'SALE'}
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
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
});

export default PropertyTypeStep;
