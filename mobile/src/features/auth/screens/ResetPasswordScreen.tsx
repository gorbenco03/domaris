/**
 * IMOBI - Reset Password Screen
 * Set a new password after reset link
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { authApi } from '@/features/auth/services';
import { Button, Input, PasswordStrength, ScreenHeader } from '@/shared/components';
import { Lock, Shield, Check } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type RoutePropType = RouteProp<AuthStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { theme } = useTheme();

  const { email, code } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Parola este obligatorie';
    } else if (password.length < 8) {
      newErrors.password = 'Minim 8 caractere';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Trebuie să conțină o literă mare';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Trebuie să conțină o cifră';
    } else if (!/[!@#$%^&*]/.test(password)) {
      newErrors.password = 'Trebuie să conțină un caracter special';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Parolele nu coincid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await authApi.resetPassword({
        email,
        code,
        newPassword: password,
      });
      console.log('Password reset successful for:', email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Reset password error:', error);
      const apiError = error?.response?.data;
      setErrors({ 
        password: apiError?.message || 'A apărut o eroare. Codul poate fi expirat.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.accent.main }]}>
            <Check size={48} color="#ffffff" />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>
            Parolă schimbată cu succes!
          </Text>
          <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
            Parola ta a fost resetată cu succes. Acum te poți autentifica cu noua parolă.
          </Text>
          <Button title="Autentifică-te" onPress={handleGoToLogin} fullWidth style={styles.loginButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="" />

          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.accent.main}15` }]}>
              <Shield size={40} color={theme.colors.accent.main} />
            </View>

            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Setează parola nouă
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Alege o parolă puternică pentru a-ți proteja contul
            </Text>

            <View style={styles.form}>
              <Input
                label="Parolă nouă"
                placeholder="Minim 8 caractere"
                value={password}
                onChangeText={(text) => { setPassword(text); if (errors.password) setErrors({ ...errors, password: '' }); }}
                secureTextEntry
                leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                error={errors.password}
                containerStyle={styles.input}
              />

              {password.length > 0 && <PasswordStrength password={password} showRequirements />}

              <Input
                label="Confirmă parola"
                placeholder="Repetă parola nouă"
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                secureTextEntry
                leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                error={errors.confirmPassword}
                containerStyle={styles.confirmInput}
              />

              <Button
                title="Salvează parola"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!password || !confirmPassword}
                fullWidth
                style={styles.submitButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8, marginBottom: 32 },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  form: { width: '100%' },
  input: { marginBottom: 8 },
  confirmInput: { marginBottom: 8, marginTop: 16 },
  submitButton: { marginTop: 32 },
  successContent: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  successTitle: { fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  successText: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 48, paddingHorizontal: 16 },
  loginButton: { width: '100%' },
});

export default ResetPasswordScreen;
