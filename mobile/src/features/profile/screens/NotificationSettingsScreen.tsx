/**
 * IMOBI - Notification Settings Screen
 * Configure push, email, and SMS notification preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Mail,
  MessageSquare,
  Home,
  DollarSign,
  Calendar,
  Megaphone,
  Shield,
  TrendingUp,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/app/providers/ThemeProvider';
import { ScreenHeader } from '@/shared/components';
import { ProfileSection, SettingsToggle } from '../components';
import { Button } from '@/shared/components';

interface NotificationPreferences {
  push: {
    newMessages: boolean;
    viewingReminders: boolean;
    priceChanges: boolean;
    newListings: boolean;
    promotions: boolean;
  };
  email: {
    weeklyDigest: boolean;
    newMessages: boolean;
    accountAlerts: boolean;
    newsletter: boolean;
  };
  sms: {
    viewingReminders: boolean;
    urgentAlerts: boolean;
  };
}

const NotificationSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push: {
      newMessages: true,
      viewingReminders: true,
      priceChanges: true,
      newListings: true,
      promotions: false,
    },
    email: {
      weeklyDigest: true,
      newMessages: false,
      accountAlerts: true,
      newsletter: false,
    },
    sms: {
      viewingReminders: true,
      urgentAlerts: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePushPreference = (key: keyof NotificationPreferences['push'], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }));
    setHasChanges(true);
  };

  const updateEmailPreference = (key: keyof NotificationPreferences['email'], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
    setHasChanges(true);
  };

  const updateSmsPreference = (key: keyof NotificationPreferences['sms'], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      sms: { ...prev.sms, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScreenHeader title="Notificări" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Intro */}
        <View style={[styles.intro, { padding: theme.spacing[4] }]}>
          <View
            style={[
              styles.introIcon,
              {
                backgroundColor: `${theme.colors.accent.main}15`,
                borderRadius: theme.borderRadius.full,
              },
            ]}
          >
            <Bell size={28} color={theme.colors.accent.main} />
          </View>
          <Text
            style={[
              styles.introText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            Alege ce notificări vrei să primești. Poți schimba aceste preferințe oricând.
          </Text>
        </View>

        {/* Push Notifications */}
        <ProfileSection title="Notificări Push">
          <SettingsToggle
            icon={<MessageSquare />}
            label="Mesaje noi"
            description="Când primești un mesaj nou"
            value={preferences.push.newMessages}
            onValueChange={(v) => updatePushPreference('newMessages', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<Calendar />}
            label="Reminder vizionări"
            description="Cu 1 oră înainte de vizionare"
            value={preferences.push.viewingReminders}
            onValueChange={(v) => updatePushPreference('viewingReminders', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<TrendingUp />}
            label="Schimbări de preț"
            description="La proprietățile din favorite"
            value={preferences.push.priceChanges}
            onValueChange={(v) => updatePushPreference('priceChanges', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<Home />}
            label="Anunțuri noi"
            description="Potrivite cu căutările tale"
            value={preferences.push.newListings}
            onValueChange={(v) => updatePushPreference('newListings', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<Megaphone />}
            label="Promoții și oferte"
            description="Reduceri și pachete speciale"
            value={preferences.push.promotions}
            onValueChange={(v) => updatePushPreference('promotions', v)}
          />
        </ProfileSection>

        {/* Email Notifications */}
        <ProfileSection title="Email">
          <SettingsToggle
            icon={<Mail />}
            label="Rezumat săptămânal"
            description="Sumar al activității tale"
            value={preferences.email.weeklyDigest}
            onValueChange={(v) => updateEmailPreference('weeklyDigest', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<MessageSquare />}
            label="Mesaje noi"
            description="Copie prin email"
            value={preferences.email.newMessages}
            onValueChange={(v) => updateEmailPreference('newMessages', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<Shield />}
            label="Alerte de securitate"
            description="Login-uri și modificări cont"
            value={preferences.email.accountAlerts}
            onValueChange={(v) => updateEmailPreference('accountAlerts', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<Megaphone />}
            label="Newsletter"
            description="Știri și articole imobiliare"
            value={preferences.email.newsletter}
            onValueChange={(v) => updateEmailPreference('newsletter', v)}
          />
        </ProfileSection>

        {/* SMS Notifications */}
        <ProfileSection title="SMS">
          <SettingsToggle
            icon={<Calendar />}
            label="Reminder vizionări"
            description="Cu 2 ore înainte de vizionare"
            value={preferences.sms.viewingReminders}
            onValueChange={(v) => updateSmsPreference('viewingReminders', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.divider, marginLeft: 74 }]} />
          <SettingsToggle
            icon={<Shield />}
            label="Alerte urgente"
            description="Probleme de securitate"
            value={preferences.sms.urgentAlerts}
            onValueChange={(v) => updateSmsPreference('urgentAlerts', v)}
          />
        </ProfileSection>
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[4],
            },
          ]}
        >
          <Button
            title="Salvează preferințele"
            onPress={handleSave}
            loading={isSaving}
            fullWidth
          />
        </View>
      )}
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
  intro: {
    alignItems: 'center',
  },
  introIcon: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  introText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
});

export default NotificationSettingsScreen;
