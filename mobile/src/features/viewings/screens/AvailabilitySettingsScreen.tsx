/**
 * RIVA - Availability Settings Screen
 * Allows property owners to set their viewing availability
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, ScreenHeader } from '@/shared/components';
import { Clock, Calendar, ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import { DAYS_OF_WEEK, WeeklySlot } from '../types';

const DEFAULT_SLOTS: WeeklySlot[] = [
  { dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }] },
  { dayOfWeek: 2, slots: [{ startTime: '10:00', endTime: '14:00' }] },
  { dayOfWeek: 3, slots: [{ startTime: '09:00', endTime: '18:00' }] },
  { dayOfWeek: 4, slots: [] },
  { dayOfWeek: 5, slots: [{ startTime: '10:00', endTime: '16:00' }] },
  { dayOfWeek: 6, slots: [{ startTime: '10:00', endTime: '13:00' }] },
  { dayOfWeek: 0, slots: [] },
];

const AvailabilitySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>(DEFAULT_SLOTS);
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(15);
  const [advanceDays, setAdvanceDays] = useState(2);
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-01-26', '2026-02-14']);
  const [isLoading, setIsLoading] = useState(false);

  const formatSlots = (slots: { startTime: string; endTime: string }[]) => {
    if (slots.length === 0) return 'Indisponibil';
    return slots.map(s => `${s.startTime}-${s.endTime}`).join(', ');
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    Alert.alert('Salvat!', 'Disponibilitatea a fost actualizată.');
  };

  const getDayName = (dayOfWeek: number) => DAYS_OF_WEEK.find(d => d.key === dayOfWeek)?.full || '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader
        title="Disponibilitate"
        onBackPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Viewings' as any);
          }
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Program săptămânal</Text>
          {weeklySlots.map((item, index) => (
            <TouchableOpacity 
              key={item.dayOfWeek} 
              style={[styles.dayRow, index < weeklySlots.length - 1 && { borderBottomColor: theme.colors.divider, borderBottomWidth: 1 }]}
              onPress={() => {
                // TODO: Navigate to day slot editor
                Alert.alert('Editare', `Editarea sloturilor pentru ${getDayName(item.dayOfWeek)} va fi disponibilă în curând.`);
              }}
            >
              <Text style={[styles.dayName, { color: theme.colors.textPrimary }]}>{getDayName(item.dayOfWeek)}</Text>
              <Text style={[styles.daySlots, { color: item.slots.length > 0 ? theme.colors.textSecondary : theme.colors.textTertiary }]}>
                {formatSlots(item.slots)}
              </Text>
              <ChevronRight size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Setări</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Editare', 'Editarea duratei va fi disponibilă în curând.')}
          >
            <View style={styles.settingInfo}>
              <Clock size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Durată vizionare</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.colors.accent.main }]}>{duration} min</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Editare', 'Editarea pauzei va fi disponibilă în curând.')}
          >
            <View style={styles.settingInfo}>
              <Clock size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Pauză între vizionări</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.colors.accent.main }]}>{buffer} min</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Editare', 'Editarea rezervării în avans va fi disponibilă în curând.')}
          >
            <View style={styles.settingInfo}>
              <Calendar size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Rezervare în avans</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.colors.accent.main }]}>{advanceDays} zile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Alert.alert('Editare', 'Editarea max vizionări/zi va fi disponibilă în curând.')}
          >
            <View style={styles.settingInfo}>
              <Calendar size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Max vizionări/zi</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.colors.accent.main }]}>{maxPerDay}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Zile blocate</Text>
            <TouchableOpacity 
              style={[styles.addBtn, { backgroundColor: theme.colors.accent.main + '20' }]}
              onPress={() => Alert.alert('Adăugare', 'Adăugarea zilelor blocate va fi disponibilă în curând.')}
            >
              <Plus size={18} color={theme.colors.accent.main} />
            </TouchableOpacity>
          </View>
          {blockedDates.map(date => (
            <View key={date} style={styles.blockedRow}>
              <Text style={[styles.blockedDate, { color: theme.colors.textSecondary }]}>
                {new Date(date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <TouchableOpacity onPress={() => setBlockedDates(prev => prev.filter(d => d !== date))}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          {blockedDates.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>Nu există zile blocate</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Button title="Salvează modificările" onPress={handleSave} loading={isLoading} fullWidth />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  dayName: { width: 90, fontSize: 14, fontWeight: '500' },
  daySlots: { flex: 1, fontSize: 13 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 14 },
  settingValue: { fontSize: 14, fontWeight: '600' },
  addBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  blockedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  blockedDate: { fontSize: 14 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  footer: { padding: 16, borderTopWidth: 1 },
});

export default AvailabilitySettingsScreen;
