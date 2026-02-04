/**
 * RIVA - Profile Edit Screen
 * Sprint 1: Extended profile editing with address and social links
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../config/useTheme';
import Button from '../../shared/components/Button';
import { updateProfile } from '../../core/api/userApi';
import type { IUpdateProfileRequest } from '../../core/api/types';
import { useAuthStore } from '../../core/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProfileEditScreen: React.FC = () => {
  const theme = useTheme();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IUpdateProfileRequest>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    postalCode: user?.postalCode || '',
    socialLinks: user?.socialLinks || {},
  });

  // Social links state
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    user?.socialLinks || {}
  );

  const handleSave = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const updatedData = {
        ...formData,
        socialLinks: Object.fromEntries(
          Object.entries(socialLinks).filter(([_, value]) => value.trim() !== '')
        ),
      };

      const response = await updateProfile(updatedData);
      if (response.success) {
        updateUser(response.user);
        Alert.alert('Succes', 'Profilul a fost actualizat cu succes');
      }
    } catch (error: any) {
      Alert.alert('Eroare', error.message || 'Nu am putut actualiza profilul');
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: keyof IUpdateProfileRequest, value: string) => {
    setFormData((prev: IUpdateProfileRequest) => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h2, { marginBottom: 8 }]}>
              Editare Profil
            </Text>
            <Text style={[theme.typography.body2, { color: theme.colors.textSecondary }]}>
              Actualizează informațiile tale personale
            </Text>
          </View>

          {/* Personal Information */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h6, { marginBottom: 16 }]}>
              Informații Personale
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Prenume
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={formData.firstName}
                onChangeText={(value) => updateFormField('firstName', value)}
                placeholder="Introdu prenumele"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Nume
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={formData.lastName}
                onChangeText={(value) => updateFormField('lastName', value)}
                placeholder="Introdu numele"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Bio
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    height: 100,
                    textAlignVertical: 'top',
                  },
                ]}
                value={formData.bio}
                onChangeText={(value) => updateFormField('bio', value)}
                placeholder="Spune-ne ceva despre tine..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Telefon
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={formData.phone}
                onChangeText={(value) => updateFormField('phone', value)}
                placeholder="+40 7xx xxx xxx"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Address Information */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h6, { marginBottom: 16 }]}>
              Adresă
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Stradă și număr
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={formData.address}
                onChangeText={(value) => updateFormField('address', value)}
                placeholder="Strada Principală 42"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Oraș
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={formData.city}
                onChangeText={(value) => updateFormField('city', value)}
                placeholder="București"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Țară
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={formData.country}
                onChangeText={(value) => updateFormField('country', value)}
                placeholder="România"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Cod poștal
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={formData.postalCode}
                onChangeText={(value) => updateFormField('postalCode', value)}
                placeholder="010123"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>

          {/* Social Links */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[theme.typography.h6, { marginBottom: 16 }]}>
              Link-uri Sociale
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Instagram
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={socialLinks.instagram || ''}
                onChangeText={(value) => updateSocialLink('instagram', value)}
                placeholder="https://instagram.com/username"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="url"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                LinkedIn
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={socialLinks.linkedin || ''}
                onChangeText={(value) => updateSocialLink('linkedin', value)}
                placeholder="https://linkedin.com/in/username"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="url"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={[theme.typography.body2, { marginBottom: 8, color: theme.colors.textSecondary }]}>
                Website
              </Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                value={socialLinks.website || ''}
                onChangeText={(value) => updateSocialLink('website', value)}
                placeholder="https://website.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="url"
              />
            </View>
          </View>

          {/* Save Button */}
          <Button
            title={loading ? 'Se salvează...' : 'Salvează Modificările'}
            onPress={handleSave}
            disabled={loading}
            style={{ marginBottom: 20 }}
          />

          {loading && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
