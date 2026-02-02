/**
 * RIVA - Welcome Screen (Redesigned)
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/shared/components';
import SocialButton from '@/shared/components/SocialButton';
import { Home } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { env } from '@/config/env';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const { loginWithGoogle, loginWithApple } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [, , googlePromptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: env.GOOGLE_IOS_CLIENT_ID ?? 'MISSING_GOOGLE_IOS_CLIENT_ID',
    androidClientId: env.GOOGLE_ANDROID_CLIENT_ID ?? 'MISSING_GOOGLE_ANDROID_CLIENT_ID',
    webClientId: env.GOOGLE_WEB_CLIENT_ID ?? 'MISSING_GOOGLE_WEB_CLIENT_ID',
  });

  const resetToMain = () => {
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  };

  const handleGoogleLogin = async () => {
    if (!env.GOOGLE_IOS_CLIENT_ID && !env.GOOGLE_ANDROID_CLIENT_ID && !env.GOOGLE_WEB_CLIENT_ID) {
      setErrorMessage('Google: lipsește configurarea Client ID. Adaugă EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID în mobile/.env.local.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await googlePromptAsync();
      const idToken = (result as any)?.params?.id_token;
      if (!idToken) throw new Error('GOOGLE_ID_TOKEN_MISSING');

      await loginWithGoogle(idToken);
      resetToMain();
    } catch (error: any) {
      console.error('Google login error:', error);
      setErrorMessage(error?.response?.data?.message || 'Eroare la autentificarea cu Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error('APPLE_IDENTITY_TOKEN_MISSING');

      await loginWithApple({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode || undefined,
        fullName: credential.fullName
          ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim() || undefined
          : undefined,
        email: credential.email || undefined,
      });

      resetToMain();
    } catch (error: any) {
      const isCancelled = error?.code === 'ERR_REQUEST_CANCELED' || error?.message === 'ERR_REQUEST_CANCELED';
      if (!isCancelled) {
        console.error('Apple login error:', error);
        setErrorMessage(error?.response?.data?.message || 'Eroare la autentificarea cu Apple');
      }
    } finally {
      setIsLoading(false);
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
          <Text style={styles.logoText}>RIVA</Text>
          <Text style={styles.tagline}>Găsește-ți casa visurilor tale</Text>
        </View>

        {/* Spacer */}
        <View style={styles.middleSpacer} />

        {/* Auth Buttons */}
        <View style={styles.authContainer}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>sau</Text>
            <View style={styles.dividerLine} />
          </View>

          <SocialButton
            provider="google"
            onPress={handleGoogleLogin}
            disabled={isLoading}
          />

          {Platform.OS === 'ios' && (
            <SocialButton
              provider="apple"
              onPress={handleAppleLogin}
              disabled={isLoading}
            />
          )}
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
  errorText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    opacity: 0.9,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dividerText: {
    marginHorizontal: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'lowercase',
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
