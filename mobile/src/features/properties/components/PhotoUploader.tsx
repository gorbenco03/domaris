/**
 * IMOBI - Photo Uploader Component
 * Drag & drop photo upload with reordering
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Alert,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  X,
  Star,
  GripVertical,
  Plus,
  Lightbulb,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Card } from '@/shared/components/Card';

// ============================================
// TYPES
// ============================================

interface Photo {
  id: string;
  uri: string;
  isPrimary: boolean;
  caption?: string;
}

interface PhotoUploaderProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  minPhotos?: number;
}

// ============================================
// COMPONENT
// ============================================

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 30,
  minPhotos = 3,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permisiune necesară',
        'Avem nevoie de acces la galeria ta pentru a încărca fotografii.'
      );
      return;
    }

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limită atinsă', `Poți încărca maxim ${maxPhotos} fotografii.`);
      return;
    }

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos: Photo[] = result.assets.map((asset, index) => ({
          id: `photo-${Date.now()}-${index}`,
          uri: asset.uri,
          isPrimary: photos.length === 0 && index === 0,
        }));

        onPhotosChange([...photos, ...newPhotos]);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut încărca fotografiile.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permisiune necesară',
        'Avem nevoie de acces la cameră pentru a face fotografii.'
      );
      return;
    }

    if (photos.length >= maxPhotos) {
      Alert.alert('Limită atinsă', `Poți încărca maxim ${maxPhotos} fotografii.`);
      return;
    }

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPhoto: Photo = {
          id: `photo-${Date.now()}`,
          uri: result.assets[0].uri,
          isPrimary: photos.length === 0,
        };

        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut face fotografia.');
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== photoId);
    
    // If removed photo was primary, set first as primary
    if (photos.find((p) => p.id === photoId)?.isPrimary && updatedPhotos.length > 0) {
      updatedPhotos[0].isPrimary = true;
    }
    
    onPhotosChange(updatedPhotos);
  };

  const setPrimaryPhoto = (photoId: string) => {
    const updatedPhotos = photos.map((p) => ({
      ...p,
      isPrimary: p.id === photoId,
    }));
    onPhotosChange(updatedPhotos);
  };

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    const updatedPhotos = [...photos];
    const [removed] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, removed);
    onPhotosChange(updatedPhotos);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Fotografii proprietate
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {photos.length}/{maxPhotos} fotografii (minim {minPhotos})
        </Text>
      </View>

      {/* Tips Card */}
      <Card variant="outlined" style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={18} color={theme.colors.secondary.warning} />
          <Text style={[styles.tipsTitle, { color: theme.colors.textPrimary }]}>
            Sfaturi pentru fotografii reușite
          </Text>
        </View>
        <View style={styles.tipsList}>
          <Text style={[styles.tipItem, { color: theme.colors.textSecondary }]}>
            • Fotografii luminoase și clare
          </Text>
          <Text style={[styles.tipItem, { color: theme.colors.textSecondary }]}>
            • Arată toate camerele principale
          </Text>
          <Text style={[styles.tipItem, { color: theme.colors.textSecondary }]}>
            • Include fața clădirii și curte
          </Text>
          <Text style={[styles.tipItem, { color: theme.colors.textSecondary }]}>
            • Prima poză = poza principală
          </Text>
        </View>
      </Card>

      {/* Photo Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.photosScroll}
        contentContainerStyle={styles.photosContainer}
      >
        {/* Add Photo Buttons */}
        <TouchableOpacity
          style={[
            styles.addPhotoButton,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary.main,
            },
          ]}
          onPress={pickImages}
          activeOpacity={0.8}
        >
          <ImageIcon size={24} color={theme.colors.primary.main} />
          <Text style={[styles.addPhotoText, { color: theme.colors.primary.main }]}>
            Galerie
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addPhotoButton,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.accent.main,
            },
          ]}
          onPress={takePhoto}
          activeOpacity={0.8}
        >
          <Camera size={24} color={theme.colors.accent.main} />
          <Text style={[styles.addPhotoText, { color: theme.colors.accent.main }]}>
            Cameră
          </Text>
        </TouchableOpacity>

        {/* Uploaded Photos */}
        {photos.map((photo, index) => (
          <View key={photo.id} style={styles.photoItem}>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            
            {/* Primary Badge */}
            {photo.isPrimary && (
              <View 
                style={[
                  styles.primaryBadge, 
                  { backgroundColor: theme.colors.accent.main }
                ]}
              >
                <Star size={12} color="#ffffff" fill="#ffffff" />
              </View>
            )}

            {/* Remove Button */}
            <TouchableOpacity
              style={[
                styles.removeButton,
                { backgroundColor: theme.colors.secondary.error },
              ]}
              onPress={() => removePhoto(photo.id)}
            >
              <X size={14} color="#ffffff" />
            </TouchableOpacity>

            {/* Set Primary Button */}
            {!photo.isPrimary && (
              <TouchableOpacity
                style={[
                  styles.setPrimaryButton,
                  { backgroundColor: 'rgba(0,0,0,0.5)' },
                ]}
                onPress={() => setPrimaryPhoto(photo.id)}
              >
                <Star size={14} color="#ffffff" />
              </TouchableOpacity>
            )}

            {/* Order indicator */}
            <View 
              style={[
                styles.orderBadge,
                { backgroundColor: 'rgba(0,0,0,0.6)' }
              ]}
            >
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
          </View>
        ))}

        {/* Add More Button */}
        {photos.length > 0 && photos.length < maxPhotos && (
          <TouchableOpacity
            style={[
              styles.addMoreButton,
              { 
                backgroundColor: theme.colors.divider,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={pickImages}
            activeOpacity={0.8}
          >
            <Plus size={32} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Status */}
      {photos.length < minPhotos && (
        <View 
          style={[
            styles.statusContainer, 
            { backgroundColor: `${theme.colors.secondary.warning}15` }
          ]}
        >
          <Text style={[styles.statusText, { color: theme.colors.secondary.warning }]}>
            Adaugă cel puțin {minPhotos - photos.length} {minPhotos - photos.length === 1 ? 'fotografie' : 'fotografii'} pentru a continua
          </Text>
        </View>
      )}

      {photos.length >= minPhotos && (
        <View 
          style={[
            styles.statusContainer, 
            { backgroundColor: `${theme.colors.accent.main}15` }
          ]}
        >
          <Text style={[styles.statusText, { color: theme.colors.accent.main }]}>
            ✓ {photos.length} {photos.length === 1 ? 'fotografie încărcată' : 'fotografii încărcate'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  tipsCard: {
    marginBottom: 20,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  photosScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setPrimaryButton: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  orderText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  addMoreButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default PhotoUploader;
