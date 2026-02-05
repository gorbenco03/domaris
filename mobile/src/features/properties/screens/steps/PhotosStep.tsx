/**
 * RIVA - Photos Step
 * Step 4 of property creation wizard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { PhotoUploader } from '@/features/properties/components/PhotoUploader';
import type { PropertyFormData } from '../CreatePropertyWizard';

// ============================================
// TYPES
// ============================================

interface PhotosStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  maxPhotos?: number;
}

// ============================================
// COMPONENT
// ============================================

const PhotosStep: React.FC<PhotosStepProps> = ({
  formData,
  updateFormData,
  maxPhotos = 5,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Adaugă fotografii
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Fotografiile de calitate atrag cu 60% mai mulți cumpărători (max. {maxPhotos})
      </Text>

      <PhotoUploader
        photos={formData.photos}
        onPhotosChange={(photos) => updateFormData({ photos })}
        minPhotos={3}
        maxPhotos={maxPhotos}
      />
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
});

export default PhotosStep;
