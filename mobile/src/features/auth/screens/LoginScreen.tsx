/**
 * RIVA - Login Screen (Redesigned)
 * Minimalist, premium design focused on credentials and social login
 * Based on Unified Account Model - no role selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button, Input, ScreenHeader } from '@/shared/components';
import { Mail, Lock, Home } from 'lucide-react-native';

const { height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { login } = useAuth();
  
  /* State */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const resetToMain = () => {
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

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
    setErrors({});

    try {
      await login(email, password);
      resetToMain();
    } catch (error: any) {
      console.error('Login error:', error);
      const isInvalidAuthResponse = error?.message === 'AUTH_RESPONSE_INVALID';
      const msg = isInvalidAuthResponse
        ? 'Serverul a trimis un răspuns OTP. Verifică dacă backend-ul este actualizat.'
        : (error?.response?.data?.message || 'Eroare la autentificare');

      setErrors({ password: isInvalidAuthResponse ? msg : 'Email sau parolă incorectă' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[theme.colors.primary.dark, theme.colors.primary.main]}
        style={styles.topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScreenHeader
            title=""
            style={{ backgroundColor: 'transparent', borderBottomColor: 'transparent' }}
          />

          {/* Logo & Title */}
          <View style={styles.brandSection}>
            <View style={styles.logoBox}>
              <Home size={28} color={theme.colors.accent.main} strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>Bine ai revenit!</Text>
            <Text style={styles.subtitle}>Autentifică-te pentru a continua</Text>
          </View>

          {/* Login Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, ...theme.shadows.xl }]}>
            {/* Form Fields */}
            <View style={styles.form}>
              <>
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Mail size={20} color={theme.colors.textTertiary} />}
                  error={errors.email}
                  containerStyle={styles.input}
                />
                <Input
                  placeholder="Parolă"
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                  secureTextEntry
                  autoComplete="password"
                  leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
                  error={errors.password}
                  containerStyle={styles.input}
                />

                {/* Forgot Password */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('ForgotPassword')} 
                  style={styles.forgotBtn}
                >
                  <Text style={[styles.forgotText, { color: theme.colors.accent.main }]}>
                    Am uitat parola
                  </Text>
                </TouchableOpacity>
              </>

              {/* Login Button */}
              <Button
                title="Autentificare"
                onPress={handleLogin}
                loading={isLoading}
                fullWidth
                style={styles.loginBtn}
              />
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Nu ai cont? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: theme.colors.accent.main }]}>
                Înregistrează-te
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.42,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  circle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle2: {
    position: 'absolute',
    top: height * 0.25,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(124, 77, 255, 0.05)', // light accent
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  form: {},
  input: {
    marginBottom: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {},
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  registerText: {
    fontSize: 15,
    color: '#64748b',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LoginScreen;
