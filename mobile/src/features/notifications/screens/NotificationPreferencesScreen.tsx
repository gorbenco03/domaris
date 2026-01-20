/**
 * IMOBI - Notification Preferences Screen
 * Settings for push, email, and SMS notifications
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ArrowLeft, Bell, Mail, MessageSquare, Moon } from 'lucide-react-native';
import { NotificationPreferences } from '../types';

const DEFAULT_PREFS: NotificationPreferences = {
  userId: 'u1',
  push: {
    enabled: true,
    messages: true,
    viewings: true,
    propertyAlerts: true,
    priceChanges: false,
    marketing: false,
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
  },
  email: { enabled: true, digest: 'weekly', transactional: true, marketing: false },
  sms: { enabled: false, viewingReminders: true, urgentOnly: true },
};

const NotificationPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  const updatePush = (key: keyof NotificationPreferences['push'], value: boolean) => {
    setPrefs(p => ({ ...p, push: { ...p.push, [key]: value } }));
  };

  const updateEmail = (key: keyof NotificationPreferences['email'], value: any) => {
    setPrefs(p => ({ ...p, email: { ...p.email, [key]: value } }));
  };

  const updateSms = (key: keyof NotificationPreferences['sms'], value: boolean) => {
    setPrefs(p => ({ ...p, sms: { ...p.sms, [key]: value } }));
  };

  const toggleQuietHours = (enabled: boolean) => {
    setPrefs(p => ({ ...p, push: { ...p.push, quietHours: { ...p.push.quietHours!, enabled } } }));
  };

  const SettingRow = ({ label, value, onToggle, disabled }: { label: string; value: boolean; onToggle: (v: boolean) => void; disabled?: boolean }) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}>
      <Text style={[styles.settingLabel, { color: disabled ? theme.colors.textTertiary : theme.colors.textPrimary }]}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} disabled={disabled} trackColor={{ true: theme.colors.accent.main, false: theme.colors.border }} thumbColor="#fff" />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Setări notificări</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Push Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={theme.colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Push Notifications</Text>
          </View>
          <SettingRow label="Mesaje noi" value={prefs.push.messages} onToggle={v => updatePush('messages', v)} />
          <SettingRow label="Vizionări" value={prefs.push.viewings} onToggle={v => updatePush('viewings', v)} />
          <SettingRow label="Alerte proprietăți" value={prefs.push.propertyAlerts} onToggle={v => updatePush('propertyAlerts', v)} />
          <SettingRow label="Schimbări preț" value={prefs.push.priceChanges} onToggle={v => updatePush('priceChanges', v)} />
          <SettingRow label="Promoții" value={prefs.push.marketing} onToggle={v => updatePush('marketing', v)} />
        </View>

        {/* Quiet Hours */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Moon size={20} color={theme.colors.secondary.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Quiet Hours</Text>
          </View>
          <SettingRow label="Activat" value={prefs.push.quietHours?.enabled || false} onToggle={toggleQuietHours} />
          {prefs.push.quietHours?.enabled && (
            <Text style={[styles.quietHint, { color: theme.colors.textSecondary }]}>
              {prefs.push.quietHours.start} - {prefs.push.quietHours.end}
            </Text>
          )}
        </View>

        {/* Email Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color={theme.colors.accent.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Email</Text>
          </View>
          <SettingRow label="Activat" value={prefs.email.enabled} onToggle={v => updateEmail('enabled', v)} />
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Digest</Text>
            <View style={styles.digestOptions}>
              {(['none', 'daily', 'weekly'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.digestBtn, prefs.email.digest === opt && { backgroundColor: theme.colors.accent.main }]}
                  onPress={() => updateEmail('digest', opt)}
                >
                  <Text style={{ color: prefs.email.digest === opt ? '#fff' : theme.colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
                    {opt === 'none' ? 'Niciodată' : opt === 'daily' ? 'Zilnic' : 'Săptămânal'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <SettingRow label="Newsletter" value={prefs.email.marketing} onToggle={v => updateEmail('marketing', v)} />
        </View>

        {/* SMS Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color={theme.colors.secondary.warning} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>SMS</Text>
          </View>
          <SettingRow label="Activat" value={prefs.sms.enabled} onToggle={v => updateSms('enabled', v)} />
          <SettingRow label="Reminder vizionări" value={prefs.sms.viewingReminders} onToggle={v => updateSms('viewingReminders', v)} disabled={!prefs.sms.enabled} />
          <SettingRow label="Doar urgente" value={prefs.sms.urgentOnly} onToggle={v => updateSms('urgentOnly', v)} disabled={!prefs.sms.enabled} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  section: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  settingLabel: { fontSize: 14 },
  quietHint: { fontSize: 13, paddingVertical: 12 },
  digestOptions: { flexDirection: 'row', gap: 8 },
  digestBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
});

export default NotificationPreferencesScreen;
