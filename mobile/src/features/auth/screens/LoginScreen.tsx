/**
 * IMOBI - Login Screen
 * User login with email/phone and password
 * Includes biometric login option
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
import { Button, Input, SocialButton, Divider, Checkbox } from '@/shared/components';
import { ArrowLeft, Mail, Lock, Fingerprint, Scan } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Biometric availability (placeholder)
  const biometricAvailable = true; 
  const biometricType: 'faceId' | 'fingerprint' = 'faceId';

  const validateForm = (): boolean => {
    // ... (validation logic)
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Emailul este obligatoriu';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email invalid';
    }
    
    if (!password) {
      newErrors.password = 'Parola este obligatorie';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await login(email, password);
      // navigation will automatically happen because RootNavigator watches auth state
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ ...errors, password: 'Credențiale invalide (Simulare)' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    // TODO: Implement biometric authentication
    console.log('Biometric login');
  };

  const handleGoogleLogin = () => {
    console.log('Google login');
  };

  const handleAppleLogin = () => {
    console.log('Apple login');
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
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Bine ai revenit! 👋
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Autentifică-te pentru a continua
            </Text>
          </View>

          {/* Biometric Login */}
          {biometricAvailable && (
            <TouchableOpacity
              onPress={handleBiometricLogin}
              style={[styles.biometricButton, { backgroundColor: theme.colors.surface }]}
              activeOpacity={0.8}
            >
              {biometricType === 'faceId' ? (
                <Scan size={32} color={theme.colors.accent.main} />
              ) : (
                <Fingerprint size={32} color={theme.colors.accent.main} />
              )}
              <Text style={[styles.biometricText, { color: theme.colors.textPrimary }]}>
                {biometricType === 'faceId' ? 'Face ID' : 'Fingerprint'}
              </Text>
              <Text style={[styles.biometricHint, { color: theme.colors.textTertiary }]}>
                Atingeți pentru autentificare rapidă
              </Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <Divider text="sau cu email" style={styles.divider} />

          {/* Login Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="nume@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
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
              placeholder="Introduceți parola"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry
              autoComplete="password"
              leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
              error={errors.password}
              containerStyle={styles.input}
            />

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <Checkbox
                checked={rememberMe}
                onChange={setRememberMe}
                label="Ține-mă minte"
              />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotPassword, { color: theme.colors.accent.main }]}>
                  Am uitat parola
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              title="Autentificare"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />
          </View>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <Divider text="sau continuă cu" style={styles.divider} />
            <View style={styles.socialButtons}>
              <SocialButton
                provider="google"
                onPress={handleGoogleLogin}
                style={styles.socialButton}
              />
              <SocialButton
                provider="apple"
                onPress={handleAppleLogin}
                style={styles.socialButton}
              />
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>
              Nu ai cont?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: theme.colors.accent.main }]}>
                Înregistrează-te
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
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  biometricText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  biometricHint: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    marginVertical: 24,
  },
  form: {},
  input: {
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 8,
  },
  socialSection: {
    marginTop: 8,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    marginBottom: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 16,
  },
  registerText: {
    fontSize: 16,
  },
  registerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
