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
  Bell,
  Moon,
  Globe,
  Palette,
  Lock,
  Smartphone,
  Trash2,
  Info,
  ChevronRight,
  HelpCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { ProfileMenuItem, ProfileSection, SettingsToggle } from '../components';
import { ScreenHeader } from '@/shared/components';
import { useTutorial } from '@/shared/services';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { resetTutorial, startTutorial } = useTutorial();

  const [isDarkMode, setIsDarkMode] = useState(themeMode === 'dark');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleReplayTutorial = () => {
    // Reset and start tutorial
    resetTutorial();
    // Navigate to Home tab first
    navigation.getParent()?.navigate('HomeTab');
    // Small delay to allow navigation, then start tutorial
    setTimeout(() => {
      startTutorial();
    }, 500);
  };

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
      <ScreenHeader title="Setări" />

      <ScrollView
        style={styles.scrollView}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: '100%', flexGrow: 1, paddingBottom: 32 }}
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

        {/* Help */}
        <ProfileSection title="Ajutor">
          <ProfileMenuItem
            icon={<HelpCircle />}
            label="Tutorial aplicație"
            description="Revedeți ghidul de utilizare"
            onPress={handleReplayTutorial}
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
