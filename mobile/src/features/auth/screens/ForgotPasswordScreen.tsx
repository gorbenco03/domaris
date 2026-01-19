/**
 * IMOBI - Forgot Password Screen
 * Request password reset via email
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, Input } from '@/shared/components';
import { ArrowLeft, Mail, Send, Check } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Emailul este obligatoriu');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email invalid');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    setError('');
    if (!validateEmail()) return;

    setIsLoading(true);
    // TODO: Implement actual password reset request
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.accent.main }]}>
            <Check size={40} color="#ffffff" />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.textPrimary }]}>Email trimis! ✉️</Text>
          <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
            Am trimis instrucțiunile de resetare la{'\n'}
            <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>{email}</Text>
          </Text>
          <Text style={[styles.successHint, { color: theme.colors.textTertiary }]}>
            Verifică inbox-ul și folder-ul de spam. Link-ul este valabil 1 oră.
          </Text>

          <View style={styles.successActions}>
            <Button title="Înapoi la Autentificare" onPress={handleBackToLogin} fullWidth />
            <TouchableOpacity onPress={() => setEmailSent(false)} style={styles.resendLink}>
              <Text style={[styles.resendText, { color: theme.colors.accent.main }]}>Nu ai primit emailul? Retrimite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary.main}15` }]}>
            <Mail size={40} color={theme.colors.primary.main} />
          </View>

          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Ai uitat parola? 🔐</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Nu-ți face griji! Introdu emailul asociat contului tău și îți vom trimite un link de resetare.
          </Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="nume@email.com"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<Mail size={20} color={theme.colors.textTertiary} />}
              error={error}
            />

            <Button
              title="Trimite link de resetare"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!email.trim()}
              fullWidth
              icon={<Send size={18} color="#ffffff" />}
              iconPosition="right"
              style={styles.submitButton}
            />
          </View>

          <TouchableOpacity onPress={handleBackToLogin} style={styles.backToLogin}>
            <ArrowLeft size={18} color={theme.colors.accent.main} />
            <Text style={[styles.backToLoginText, { color: theme.colors.accent.main }]}>Înapoi la Autentificare</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8, marginBottom: 32 },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 16 },
  form: { width: '100%' },
  submitButton: { marginTop: 24 },
  backToLogin: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, padding: 8 },
  backToLoginText: { fontSize: 16, fontWeight: '600' },
  successContent: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  successText: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 12 },
  successHint: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  successActions: { width: '100%', marginTop: 48 },
  resendLink: { alignItems: 'center', marginTop: 24, padding: 8 },
  resendText: { fontSize: 15, fontWeight: '600' },
});

export default ForgotPasswordScreen;
