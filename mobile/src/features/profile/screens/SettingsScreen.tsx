/**
 * IMOBI - Settings Screen
 * App settings and preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Palette,
  Lock,
  Smartphone,
  Trash2,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { ProfileMenuItem, ProfileSection, SettingsToggle } from '../components';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [isDarkMode, setIsDarkMode] = useState(themeMode === 'dark');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleDarkModeToggle = (value: boolean) => {
    setIsDarkMode(value);
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Ștergere cont',
      'Ești sigur că vrei să ștergi contul? Această acțiune este ireversibilă și toate datele tale vor fi șterse permanent.',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge contul',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            console.log('Account deletion requested');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.lg,
            },
          ]}
        >
          Setări
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Notifications */}
        <ProfileSection title="Notificări">
          <ProfileMenuItem
            icon={<Bell />}
            label="Preferințe notificări"
            description="Push, email, SMS"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </ProfileSection>

        {/* Appearance */}
        <ProfileSection title="Aspect">
          <SettingsToggle
            icon={<Moon />}
            label="Mod întunecat"
            description="Reduce oboseala ochilor"
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <ProfileMenuItem
            icon={<Globe />}
            label="Limbă"
            rightElement={
              <View style={styles.valueContainer}>
                <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>
                  Română
                </Text>
                <ChevronRight size={18} color={theme.colors.textTertiary} />
              </View>
            }
            showArrow={false}
            onPress={() => console.log('Language selection')}
          />
        </ProfileSection>

        {/* Security */}
        <ProfileSection title="Securitate">
          <ProfileMenuItem
            icon={<Lock />}
            label="Schimbă parola"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsToggle
            icon={<Smartphone />}
            label="Autentificare biometrică"
            description="Face ID / Fingerprint"
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
          />
        </ProfileSection>

        {/* About */}
        <ProfileSection title="Despre">
          <ProfileMenuItem
            icon={<Info />}
            label="Versiunea aplicației"
            rightElement={
              <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>
                1.0.0 (Build 1)
              </Text>
            }
            showArrow={false}
          />
        </ProfileSection>

        {/* Danger Zone */}
        <ProfileSection title="Zona de pericol">
          <ProfileMenuItem
            icon={<Trash2 />}
            label="Șterge contul"
            description="Acțiune permanentă și ireversibilă"
            onPress={handleDeleteAccount}
            danger
            showArrow={false}
          />
        </ProfileSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  divider: {
    height: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    marginRight: 4,
  },
  versionText: {
    fontSize: 14,
  },
});

export default SettingsScreen;
