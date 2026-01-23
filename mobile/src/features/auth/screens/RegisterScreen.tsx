/**
 * IMOBI - Register Screen
 * New user registration with email or phone
 * Step 1: Email or Phone
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { authApi } from '@/features/auth/api';
import {
  Button,
  Input,
  Checkbox,
  PasswordStrength,
} from '@/shared/components';
import { ArrowLeft, Mail, Phone, User, Lock } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type RegisterMethod = 'email' | 'phone';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { register } = useAuth();

  // Auth method
  const [method, setMethod] = useState<RegisterMethod>('email');

  // Form state - Email
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form state - Phone
  const [phone, setPhone] = useState('');

  // Common state
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmailForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Numele este obligatoriu';
    }

    if (!email.trim()) {
      newErrors.email = 'Emailul este obligatoriu';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email invalid';
    }

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

    if (!acceptTerms) {
      newErrors.terms = 'Trebuie să accepți termenii și condițiile';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePhoneForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Numele este obligatoriu';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Numărul de telefon este obligatoriu';
    } else if (!/^\+[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Format telefon invalid (ex: +40712345678)';
    }

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

    if (!acceptTerms) {
      newErrors.terms = 'Trebuie să accepți termenii și condițiile';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    const isValid = method === 'email' ? validateEmailForm() : validatePhoneForm();
    if (!isValid) return;

    setIsLoading(true);
    setErrors({});

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    try {
      if (method === 'email') {
        await register({
          email,
          password,
          firstName,
          lastName,
        });
        console.log('OTP sent for email registration');
        navigation.navigate('OTPVerification', {
          email,
          type: 'email',
          purpose: 'register',
          registerData: { firstName, lastName, password },
        });
      } else {
        await authApi.registerWithPhone({
          phone,
          password,
          firstName,
          lastName,
        });
        console.log('OTP sent for phone registration');
        navigation.navigate('OTPVerification', {
          phone,
          type: 'phone',
          purpose: 'register',
          registerData: { firstName, lastName, password },
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const apiError = error?.response?.data;
      
      if (apiError?.code === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ email: 'Acest email este deja utilizat' });
      } else if (apiError?.code === 'PHONE_ALREADY_EXISTS') {
        setErrors({ phone: 'Acest număr de telefon este deja utilizat' });
      } else {
        setErrors({ 
          general: apiError?.message || 'A apărut o eroare la înregistrare. Încearcă din nou.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            >
              <ArrowLeft size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            
            {/* Progress Indicator - Simplified for Unified Account */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressStep, { backgroundColor: theme.colors.accent.main }]} />
              <View style={[styles.progressStep, { backgroundColor: theme.colors.divider }]} />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Creează cont
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Creezi parola acum, apoi confirmi contul prin cod
            </Text>
          </View>

          {/* Method Tabs */}
          <View style={[styles.methodTabs, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              onPress={() => setMethod('email')}
              style={[
                styles.methodTab,
                method === 'email' && {
                  backgroundColor: theme.colors.primary.main,
                },
              ]}
            >
              <Mail
                size={18}
                color={method === 'email' ? '#ffffff' : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.methodTabText,
                  {
                    color: method === 'email' ? '#ffffff' : theme.colors.textSecondary,
                  },
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMethod('phone')}
              style={[
                styles.methodTab,
                method === 'phone' && {
                  backgroundColor: theme.colors.primary.main,
                },
              ]}
            >
              <Phone
                size={18}
                color={method === 'phone' ? '#ffffff' : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.methodTabText,
                  {
                    color: method === 'phone' ? '#ffffff' : theme.colors.textSecondary,
                  },
                ]}
              >
                Telefon
              </Text>
            </TouchableOpacity>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            {/* Common Name Field */}
            <Input
              label="Nume complet"
              placeholder="Ion Popescu"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              autoComplete="name"
              leftIcon={<User size={20} color={theme.colors.textTertiary} />}
              error={errors.name}
              containerStyle={styles.input}
            />

            {method === 'email' ? (
              <>
                <Input
                  label="Email"
                  placeholder="nume@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Mail size={20} color={theme.colors.textTertiary} />}
                  error={errors.email}
                  containerStyle={styles.input}
                />

                <Input
                  label="Parolă"
                  placeholder="Minim 8 caractere"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  secureTextEntry
                  leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                  error={errors.password}
                  containerStyle={styles.input}
                />

                {password.length > 0 && (
                  <PasswordStrength password={password} showRequirements />
                )}

                <Input
                  label="Confirmă parola"
                  placeholder="Repetă parola"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: '' });
                  }}
                  secureTextEntry
                  leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                  error={errors.confirmPassword}
                  containerStyle={styles.confirmPasswordInput}
                />
              </>
            ) : (
              <>
                <Input
                  label="Număr de telefon"
                  placeholder="+40 7XX XXX XXX"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  keyboardType="phone-pad"
                  leftIcon={<Phone size={20} color={theme.colors.textTertiary} />}
                  error={errors.phone}
                  containerStyle={styles.input}
                />

                <Input
                  label="Parolă"
                  placeholder="Minim 8 caractere"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  secureTextEntry
                  leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                  error={errors.password}
                  containerStyle={styles.input}
                />

                {password.length > 0 && (
                  <PasswordStrength password={password} showRequirements />
                )}

                <Input
                  label="Confirmă parola"
                  placeholder="Repetă parola"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: '' });
                  }}
                  secureTextEntry
                  leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                  error={errors.confirmPassword}
                  containerStyle={styles.confirmPasswordInput}
                />
              </>
            )}

            {/* Terms and Conditions */}
            <Checkbox
              checked={acceptTerms}
              onChange={setAcceptTerms}
              error={!!errors.terms}
              label={
                <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                  Accept{' '}
                  <Text style={[styles.termsLink, { color: theme.colors.accent.main }]}>
                    Termenii și Condițiile
                  </Text>
                  {' '}și{' '}
                  <Text style={[styles.termsLink, { color: theme.colors.accent.main }]}>
                    Politica de Confidențialitate
                  </Text>
                </Text>
              }
              containerStyle={styles.termsCheckbox}
            />
            {errors.terms && (
              <Text style={[styles.errorText, { color: theme.colors.secondary.error }]}>
                {errors.terms}
              </Text>
            )}

            {/* Register Button */}
            <Button
              title="Continuă"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
              Ai deja cont?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.colors.accent.main }]}>
                Autentifică-te
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginRight: 44,
  },
  progressStep: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  methodTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  methodTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {},
  input: {
    marginBottom: 16,
  },
  confirmPasswordInput: {
    marginBottom: 16,
    marginTop: 16,
  },
  termsCheckbox: {
    marginTop: 8,
    marginBottom: 4,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 34,
  },
  registerButton: {
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 16,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
