/**
 * IMOBI - Login Screen (Redesigned)
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button, Input, SocialButton, Divider } from '@/shared/components';
import { ArrowLeft, Mail, Lock, Home } from 'lucide-react-native';

const { height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { login } = useAuth();
  
  /* State */
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; phone?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (method === 'email') {
      if (!email.trim()) {
        newErrors.email = 'Emailul este obligatoriu';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Format email invalid';
      }
      if (!password) {
        newErrors.password = 'Parola este obligatorie';
      }
    } else {
      if (!phone.trim()) {
        newErrors.phone = 'Numărul de telefon este obligatoriu';
      } else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Format telefon invalid';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});

    try {
      if (method === 'email') {
        await login(email, password);
      } else {
        // Phone Login - Step 1: Send OTP
        const response = await import('@/features/auth/api').then(m => m.authApi.loginWithPhone({ phone }));
        console.log('Login OTP sent:', response);
        
        // Navigate to OTP Verification
        navigation.navigate('OTPVerification', {
          phone,
          type: 'phone',
          purpose: 'login'
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error?.response?.data?.message || 'Eroare la autentificare';
      
      if (method === 'email') {
        setErrors({ password: 'Email sau parolă incorectă' });
      } else {
        setErrors({ phone: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login('google-user@example.com', 'social');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      await login('apple-user@example.com', 'social');
    } catch (error) {
      console.error(error);
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          </View>

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
            {/* Social Login - First */}
            {/* Social Login - First */}
            <View style={styles.socialSection}>
              <SocialButton provider="google" onPress={handleGoogleLogin} style={styles.socialBtn} />
              <SocialButton provider="apple" onPress={handleAppleLogin} style={styles.socialBtn} />
            </View>

            <Divider text="sau cu" style={styles.divider} />

            {/* Method Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, method === 'email' && styles.activeTab, { borderColor: method === 'email' ? theme.colors.primary.main : theme.colors.border }]}
                onPress={() => setMethod('email')}
              >
                <Mail size={18} color={method === 'email' ? theme.colors.primary.main : theme.colors.textSecondary} />
                <Text style={[styles.tabText, { color: method === 'email' ? theme.colors.primary.main : theme.colors.textSecondary }]}>Email</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, method === 'phone' && styles.activeTab, { borderColor: method === 'phone' ? theme.colors.primary.main : theme.colors.border }]}
                onPress={() => setMethod('phone')}
              >
                <View style={{ transform: [{ rotate: '0deg' }] }}>
                  {/* Using a generic icon or Phone icon if imported */}
                   <Text>📱</Text> 
                </View>
                <Text style={[styles.tabText, { color: method === 'phone' ? theme.colors.primary.main : theme.colors.textSecondary }]}>Telefon</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {method === 'email' ? (
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
              ) : (
                <Input
                  placeholder="Număr de telefon"
                  value={phone}
                  onChangeText={(t) => { setPhone(t); if (errors.phone) setErrors({ ...errors, phone: undefined }); }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  // Using Mail icon temporarily or import Phone
                  leftIcon={<Text>📱</Text>}
                  error={errors.phone}
                  containerStyle={styles.input}
                />
              )}

              {/* Login Button */}
              <Button
                title={method === 'email' ? "Autentificare" : "Trimite cod OTP"}
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
  socialSection: {
    gap: 12,
  },
  socialBtn: {
    marginBottom: 0,
  },
  divider: {
    marginVertical: 20,
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
