/**
 * IMOBI - Welcome Screen
 * First screen users see when opening the app
 * Premium design with clear CTAs
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button, SocialButton, Divider } from '@/shared/components';
import { Home, Search, Shield } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await login('google-user@example.com', 'social');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      await login('apple-user@example.com', 'social');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.primary.dark, theme.colors.primary.main, theme.colors.primary.light]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      
      <SafeAreaView style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[theme.colors.accent.main, theme.colors.accent.dark]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Home size={32} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
          </View>
          <Text style={styles.logoText}>IMOBI</Text>
          <Text style={styles.tagline}>
            Gasește-ți casa visurilor tale
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Search size={20} color={theme.colors.accent.main} />
            </View>
            <Text style={styles.featureText}>Căutare inteligentă cu AI</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Home size={20} color={theme.colors.secondary.main} />
            </View>
            <Text style={styles.featureText}>Mii de proprietăți verificate</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Shield size={20} color={theme.colors.secondary.warning} />
            </View>
            <Text style={styles.featureText}>Tranzacții 100% sigure</Text>
          </View>
        </View>

        {/* Auth Buttons */}
        <View style={styles.authContainer}>
          {/* Primary CTAs */}
          <Button
            title="Creează cont gratuit"
            onPress={() => navigation.navigate('Register')}
            variant="primary"
            fullWidth
            style={styles.primaryButton}
          />
          
          <Button
            title="Am deja cont"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />

          {/* Divider */}
          <Divider text="sau continuă cu" style={styles.divider} />

          {/* Social Login */}
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Prin continuare, accepți{' '}
            <Text style={styles.footerLink}>Termenii și Condițiile</Text>
            {' '}și{' '}
            <Text style={styles.footerLink}>Politica de Confidențialitate</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  features: {
    marginVertical: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  authContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  secondaryButtonText: {
    color: '#ffffff',
  },
  divider: {
    marginVertical: 24,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    marginBottom: 12,
  },
  footer: {
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
