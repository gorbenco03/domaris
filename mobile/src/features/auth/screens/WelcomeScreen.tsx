/**
 * IMOBI - Welcome Screen (Redesigned)
 * Clean, minimalist first screen with focus on login/register
 * Based on Unified Account Model - simple entry point
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button, SocialButton, Divider } from '@/shared/components';
import { Home } from 'lucide-react-native';

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
      <View style={styles.decorativeCircle3} />
      
      <SafeAreaView style={styles.content}>
        {/* Spacer for top */}
        <View style={styles.topSpacer} />

        {/* Logo & Branding - Centered and prominent */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[theme.colors.accent.main, theme.colors.accent.dark]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Home size={36} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
          </View>
          <Text style={styles.logoText}>IMOBI</Text>
          <Text style={styles.tagline}>Găsește-ți casa visurilor tale</Text>
        </View>

        {/* Spacer */}
        <View style={styles.middleSpacer} />

        {/* Auth Buttons */}
        <View style={styles.authContainer}>
          {/* Social Login First - Easiest path */}
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

          {/* Divider */}
          <Divider text="sau" style={styles.divider} />

          {/* Email CTAs */}
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
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: height * 0.35,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  topSpacer: {
    flex: 0.8,
  },
  brandSection: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 10,
    textAlign: 'center',
  },
  middleSpacer: {
    flex: 1.2,
  },
  authContainer: {
    marginBottom: 16,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 8,
  },
  socialButton: {
    marginBottom: 0,
  },
  divider: {
    marginVertical: 20,
  },
  primaryButton: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  secondaryButtonText: {
    color: '#ffffff',
  },
  footer: {
    paddingBottom: 12,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.85)',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
