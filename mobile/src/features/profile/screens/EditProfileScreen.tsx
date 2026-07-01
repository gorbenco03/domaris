/**
 * RIVA - Edit Profile Screen
 * Screen for editing user profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Check,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Avatar } from '../components';
import { Button, Input, ScreenHeader } from '@/shared/components';

import { useUpdateProfile, useUploadAvatar } from '@/features/profile/services';
import { useAuth } from '@/app/providers/AuthProvider';

const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Hooks
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatar: user?.avatar,
    bio: (user as any)?.bio || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    location: (user as any)?.location || '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permisiune necesară',
        'Avem nevoie de acces la galeria foto pentru a schimba avatarul.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any, // Fix legacy enum issue
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Optimistic update locally
      setFormData((prev) => ({ ...prev, avatar: result.assets[0].uri }));
      
      // Upload immediately
      try {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        const formData = new FormData();
        formData.append('file', { uri: localUri, name: filename, type } as any);

        await uploadAvatarMutation.mutateAsync(formData);
        Alert.alert('Succes', 'Fotografia a fost actualizată.');
      } catch (error) {
        console.error('Avatar upload failed', error);
        Alert.alert('Eroare', 'Nu am putut încărca fotografia.');
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
      });

      setHasChanges(false);
      Alert.alert('Succes', 'Profilul a fost actualizat cu succes!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Eroare', 'Nu am putut actualiza profilul.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Editare profil" />

        <ScrollView
          style={styles.scrollView}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ width: '100%', flexGrow: 1, paddingBottom: 32 }}
        >
          {/* Avatar Section */}
          <View style={[styles.avatarSection, { paddingVertical: theme.spacing[6] }]}>
            <Avatar
              firstName={formData.firstName}
              lastName={formData.lastName}
              source={formData.avatar ?? undefined}
              size="xl"
              showEditButton
              onEditPress={handlePickImage}
            />
            <TouchableOpacity onPress={handlePickImage} style={{ marginTop: theme.spacing[3] }}>
              <Text
                style={[
                  styles.changePhotoText,
                  {
                    color: theme.colors.accent.main,
                    fontSize: theme.typography.fontSize.base,
                  },
                ]}
              >
                Schimbă fotografia
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={[styles.formSection, { paddingHorizontal: theme.spacing[4] }]}>
            {/* Personal Info */}
            <View style={[styles.formGroup, { marginBottom: theme.spacing[6] }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.xs,
                    marginBottom: theme.spacing[3],
                  },
                ]}
              >
                INFORMAȚII PERSONALE
              </Text>
              
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.xl,
                    padding: theme.spacing[4],
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <View style={styles.inputRow}>
                  <View style={[styles.inputHalf, { marginRight: theme.spacing[2] }]}>
                    <Input
                      label="Prenume"
                      value={formData.firstName}
                      onChangeText={(text) => updateField('firstName', text)}
                      leftIcon={<User size={20} color={theme.colors.textTertiary} />}
                    />
                  </View>
                  <View style={[styles.inputHalf, { marginLeft: theme.spacing[2] }]}>
                    <Input
                      label="Nume"
                      value={formData.lastName}
                      onChangeText={(text) => updateField('lastName', text)}
                    />
                  </View>
                </View>

                <View style={{ marginTop: theme.spacing[4] }}>
                  <Input
                    label="Bio"
                    value={formData.bio}
                    onChangeText={(text) => updateField('bio', text)}
                    multiline
                    numberOfLines={4}
                    leftIcon={<FileText size={20} color={theme.colors.textTertiary} />}
                    placeholder="Scrie câteva cuvinte despre tine..."
                  />
                  <Text
                    style={[
                      styles.charCount,
                      {
                        color: theme.colors.textTertiary,
                        fontSize: theme.typography.fontSize.xs,
                        marginTop: theme.spacing[1],
                      },
                    ]}
                  >
                    {formData.bio.length}/500
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact Info */}
            <View style={[styles.formGroup, { marginBottom: theme.spacing[6] }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.xs,
                    marginBottom: theme.spacing[3],
                  },
                ]}
              >
                CONTACT
              </Text>
              
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.xl,
                    padding: theme.spacing[4],
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <Input
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={20} color={theme.colors.textTertiary} />}
                />
                
                <View style={{ marginTop: theme.spacing[4] }}>
                  <Input
                    label="Telefon"
                    value={formData.phone}
                    onChangeText={(text) => updateField('phone', text)}
                    keyboardType="phone-pad"
                    leftIcon={<Phone size={20} color={theme.colors.textTertiary} />}
                  />
                </View>
              </View>
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.xs,
                    marginBottom: theme.spacing[3],
                  },
                ]}
              >
                LOCAȚIE
              </Text>

              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.xl,
                    padding: theme.spacing[4],
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <Input
                  label="Locație"
                  value={formData.location}
                  onChangeText={(text) => updateField('location', text)}
                  leftIcon={<MapPin size={20} color={theme.colors.textTertiary} />}
                  placeholder="ex. București, Sector 1"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[4],
            },
          ]}
        >
          <Button
            title="Salvează modificările"
            onPress={handleSave}
            loading={isLoading}
            disabled={!hasChanges}
            fullWidth
            icon={<Check size={20} color="#ffffff" />}
            iconPosition="right"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
  },
  changePhotoText: {
    fontWeight: '600',
  },
  formSection: {},
  formGroup: {},
  sectionTitle: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formCard: {},
  inputRow: {
    flexDirection: 'row',
  },
  inputHalf: {
    flex: 1,
  },
  charCount: {
    textAlign: 'right',
  },
  footer: {
    borderTopWidth: 1,
  },
});

export default EditProfileScreen;
