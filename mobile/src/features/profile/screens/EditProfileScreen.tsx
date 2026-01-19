/**
 * IMOBI - Edit Profile Screen
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
  ArrowLeft,
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
import { Button, Input } from '@/shared/components';

// Mock initial data
const initialData = {
  firstName: 'Ion',
  lastName: 'Popescu',
  avatar: undefined as string | undefined,
  bio: 'Proprietar de apartamente în București. Caut să închiriez pe termen lung persoanelor serioase.',
  email: 'ion.popescu@email.com',
  phone: '+40 721 123 456',
  city: 'București',
  county: 'Sector 1',
};

const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [formData, setFormData] = useState(initialData);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, avatar: result.assets[0].uri }));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setHasChanges(false);
    
    Alert.alert('Succes', 'Profilul a fost actualizat cu succes!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
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
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.typography.fontSize.lg,
              },
            ]}
          >
            Editare profil
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Avatar Section */}
          <View style={[styles.avatarSection, { paddingVertical: theme.spacing[6] }]}>
            <Avatar
              firstName={formData.firstName}
              lastName={formData.lastName}
              source={formData.avatar}
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
                <View style={styles.inputRow}>
                  <View style={[styles.inputHalf, { marginRight: theme.spacing[2] }]}>
                    <Input
                      label="Oraș"
                      value={formData.city}
                      onChangeText={(text) => updateField('city', text)}
                      leftIcon={<MapPin size={20} color={theme.colors.textTertiary} />}
                    />
                  </View>
                  <View style={[styles.inputHalf, { marginLeft: theme.spacing[2] }]}>
                    <Input
                      label="Sector/Județ"
                      value={formData.county}
                      onChangeText={(text) => updateField('county', text)}
                    />
                  </View>
                </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
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
