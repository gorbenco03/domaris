/**
 * RIVA - OTP Verification Screen
 * Phone/Email verification with OTP code
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { authApi } from '@/features/auth/services';
import { Button, OTPInput, ScreenHeader } from '@/shared/components';
import { Mail, RefreshCw, Check } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type RoutePropType = RouteProp<AuthStackParamList, 'OTPVerification'>;

const RESEND_COOLDOWN = 60;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { theme } = useTheme();
  const { verifyEmailOtp } = useAuth();

  const { email, purpose, registerData } = route.params;
  const destination = email;

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [verified, setVerified] = useState(false);
  const lastSubmittedCode = useRef<string | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    if (isVerifying || verified) return;
    if (lastSubmittedCode.current === code) return;
    lastSubmittedCode.current = code;
    setIsVerifying(true);
    setError('');

    try {
      if (purpose === 'reset-password') {
        navigation.navigate('ResetPassword', { email: destination, code });
        return;
      }

      await verifyEmailOtp(destination, code);

      setVerified(true);
      console.log('OTP verified successfully');
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const apiError = error?.response?.data;
      
      setAttempts((prev) => prev - 1);
      if (apiError?.code === 'OTP_INVALID') {
        setError(attempts <= 1 
          ? 'Cod invalid. Te rugăm să soliciți un cod nou.'
          : `Cod incorect. Mai ai ${attempts - 1} încercări.`);
      } else if (apiError?.code === 'OTP_TOO_MANY_ATTEMPTS') {
        setError('Prea multe încercări. Te rugăm să soliciți un cod nou.');
      } else {
        setError(apiError?.message || 'Eroare la verificare. Încearcă din nou.');
      }
    } finally {
      setIsVerifying(false);
    }
  }, [destination, verifyEmailOtp, attempts, navigation, purpose, isVerifying, verified]);

  const handleResend = async () => {
    setError('');
    setIsVerifying(true);

    try {
      if (purpose === 'register') {
        if (!registerData?.password) {
          setError('Reintrodu parola în pasul anterior pentru a retrimite codul.');
          setIsVerifying(false);
          return;
        }

        if (
          typeof registerData?.acceptTerms !== 'boolean' ||
          typeof registerData?.acceptPrivacy !== 'boolean' ||
          typeof registerData?.acceptGdpr !== 'boolean'
        ) {
          setError('Reia înregistrarea pentru a retrimite codul.');
          setIsVerifying(false);
          return;
        }

        await authApi.registerWithEmail({
          email: destination,
          password: registerData?.password || '',
          firstName: registerData?.firstName,
          lastName: registerData?.lastName,
          acceptTerms: registerData.acceptTerms,
          acceptPrivacy: registerData.acceptPrivacy,
          acceptGdpr: registerData.acceptGdpr,
          acceptMarketing: registerData.acceptMarketing,
          acceptAnalytics: registerData.acceptAnalytics,
        });
      } else if (purpose === 'reset-password') {
        await authApi.forgotPassword({ email: destination });
      }
      
      setOtp('');
      setAttempts(3);
      setResendCooldown(RESEND_COOLDOWN);
      console.log('OTP resent successfully');
    } catch (error: any) {
      console.error('OTP resend error:', error);
      setError('Eroare la retrimiterea codului. Încearcă din nou.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScreenHeader
          title=""
          rightSlot={
            <View style={styles.progressContainer}>
              <View style={[styles.progressStep, { backgroundColor: theme.colors.accent.main }]} />
              <View style={[styles.progressStep, { backgroundColor: theme.colors.accent.main }]} />
              <View style={[styles.progressStep, { backgroundColor: theme.colors.divider }]} />
            </View>
          }
        />

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: verified ? theme.colors.accent.main : `${theme.colors.primary.main}15` }]}>
            {verified ? <Check size={40} color="#ffffff" /> : <Mail size={40} color={theme.colors.primary.main} />}
          </View>

          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{verified ? 'Verificat cu succes!' : 'Verifică codul'}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {verified ? 'Contul tău a fost verificat' : `Am trimis un cod de 6 cifre la\n`}
            {!verified && <Text style={[styles.destination, { color: theme.colors.textPrimary }]}>{destination}</Text>}
          </Text>

          {!verified && (
            <View style={styles.otpContainer}>
              <OTPInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} onComplete={handleVerify} error={!!error} />
              {error && <Text style={[styles.error, { color: theme.colors.secondary.error }]}>{error}</Text>}
              <View style={styles.resendContainer}>
                {resendCooldown > 0 ? (
                  <Text style={[styles.timerText, { color: theme.colors.textTertiary }]}>Retrimite în <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>{formatTime(resendCooldown)}</Text></Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                    <RefreshCw size={18} color={theme.colors.accent.main} />
                    <Text style={[styles.resendText, { color: theme.colors.accent.main }]}>Retrimite codul</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.spacer} />
          {!verified && (
            <Button
              title="Verifică"
              onPress={() => handleVerify(otp)}
              loading={isVerifying}
              disabled={otp.length !== 6 || attempts === 0 || isVerifying}
              fullWidth
            />
          )}
          {!verified && <Text style={[styles.helpText, { color: theme.colors.textTertiary }]}>Nu ai primit codul? Verifică spam</Text>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  progressContainer: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8, marginRight: 44 },
  progressStep: { width: 32, height: 4, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  destination: { fontWeight: '600' },
  otpContainer: { width: '100%', marginTop: 32, alignItems: 'center' },
  error: { fontSize: 14, marginTop: 16, textAlign: 'center' },
  resendContainer: { marginTop: 32, alignItems: 'center' },
  timerText: { fontSize: 15 },
  resendButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  resendText: { fontSize: 16, fontWeight: '600' },
  spacer: { flex: 1, minHeight: 40 },
  helpText: { fontSize: 14, textAlign: 'center', marginTop: 16, marginBottom: 24 },
});

export default OTPVerificationScreen;
