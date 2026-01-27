/**
 * IMOBI - Change Password Screen
 * Screen for changing user password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Check, Shield } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, Input, PasswordStrength, ScreenHeader } from '@/shared/components';

const ChangePasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Parola curentă este obligatorie';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Parola nouă este obligatorie';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Parola trebuie să aibă cel puțin 8 caractere';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmarea parolei este obligatorie';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parolele nu coincid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);

    Alert.alert(
      'Succes',
      'Parola a fost schimbată cu succes!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const isFormValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Schimbă parola" />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Security Icon */}
          <View style={[styles.iconSection, { paddingVertical: theme.spacing[6] }]}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${theme.colors.accent.main}15`,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
            >
              <Shield size={40} color={theme.colors.accent.main} />
            </View>
            <Text
              style={[
                styles.securityText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                  marginTop: theme.spacing[3],
                },
              ]}
            >
              Alege o parolă puternică pentru a-ți proteja contul
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formSection, { paddingHorizontal: theme.spacing[4] }]}>
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
                label="Parola curentă"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }}
                secureTextEntry
                leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                error={errors.currentPassword}
                placeholder="Introdu parola curentă"
              />

              <View style={{ marginTop: theme.spacing[4] }}>
                <Input
                  label="Parola nouă"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }}
                  secureTextEntry
                  leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                  error={errors.newPassword}
                  placeholder="Minim 8 caractere"
                />
                {newPassword && (
                  <View style={{ marginTop: theme.spacing[2] }}>
                    <PasswordStrength password={newPassword} />
                  </View>
                )}
              </View>

              <View style={{ marginTop: theme.spacing[4] }}>
                <Input
                  label="Confirmă parola nouă"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  secureTextEntry
                  leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                  error={errors.confirmPassword}
                  placeholder="Repetă parola nouă"
                />
              </View>
            </View>

            {/* Tips */}
            <View style={{ marginTop: theme.spacing[5] }}>
              <Text
                style={[
                  styles.tipsTitle,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.xs,
                    marginBottom: theme.spacing[2],
                  },
                ]}
              >
                SFATURI PENTRU O PAROLĂ SIGURĂ
              </Text>
              <View
                style={[
                  styles.tipsCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing[4],
                  },
                ]}
              >
                {[
                  'Folosește cel puțin 8 caractere',
                  'Combină litere mari și mici',
                  'Adaugă cifre și caractere speciale',
                  'Nu folosi informații personale',
                ].map((tip, index) => (
                  <View key={index} style={styles.tipRow}>
                    <Check size={16} color={theme.colors.accent.main} />
                    <Text
                      style={[
                        styles.tipText,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.fontSize.sm,
                          marginLeft: theme.spacing[2],
                        },
                      ]}
                    >
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
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
            title="Schimbă parola"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!isFormValid}
            fullWidth
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
  iconSection: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityText: {
    textAlign: 'center',
    maxWidth: 280,
  },
  formSection: {},
  formCard: {},
  tipsTitle: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tipsCard: {},
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {},
  footer: {
    borderTopWidth: 1,
  },
});

export default ChangePasswordScreen;
