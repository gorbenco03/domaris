/**
 * IMOBI - Request Viewing Screen
 * Allows seekers to request a property viewing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { CalendarSelector, TimeSlotPicker } from '../components';
import { Button } from '@/shared/components';
import { TimeSlot } from '../types';
import { ArrowLeft, Home, MapPin, MessageSquare, Info } from 'lucide-react-native';

const MOCK_PROPERTY = {
  id: 'p1',
  title: 'Apartament 3 camere modern',
  address: 'Str. Drumul Taberei 45, București',
  imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
  price: 120000,
};

const MOCK_AVAILABLE_DATES = ['2026-01-21', '2026-01-22', '2026-01-23', '2026-01-24', '2026-01-25'];

const MOCK_SLOTS: Record<string, TimeSlot[]> = {
  '2026-01-21': [
    { date: '2026-01-21', startTime: '09:00', endTime: '09:30' },
    { date: '2026-01-21', startTime: '10:00', endTime: '10:30' },
    { date: '2026-01-21', startTime: '14:00', endTime: '14:30' },
    { date: '2026-01-21', startTime: '15:00', endTime: '15:30' },
  ],
  '2026-01-22': [
    { date: '2026-01-22', startTime: '10:00', endTime: '10:30' },
    { date: '2026-01-22', startTime: '11:00', endTime: '11:30' },
  ],
};

const RequestViewingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  
  const handleDateSelect = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(prev => prev.filter(d => d !== date));
      setSelectedSlots(prev => prev.filter(s => s.date !== date));
    } else {
      setSelectedDates(prev => [...prev, date]);
      setCurrentDate(date);
    }
  };
  
  const handleSlotSelect = (slot: TimeSlot) => {
    const exists = selectedSlots.some(s => s.date === slot.date && s.startTime === slot.startTime);
    if (exists) {
      setSelectedSlots(prev => prev.filter(s => !(s.date === slot.date && s.startTime === slot.startTime)));
    } else {
      setSelectedSlots(prev => [...prev, slot]);
    }
  };
  
  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert('Atenție', 'Selectează cel puțin un slot.');
      return;
    }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    Alert.alert('Cerere trimisă!', 'Proprietarul va confirma în curând.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Programează vizionare</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.propCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.propImg, { backgroundColor: theme.colors.divider }]}>
            {MOCK_PROPERTY.imageUrl ? <Image source={{ uri: MOCK_PROPERTY.imageUrl }} style={styles.img} /> : <Home size={28} color={theme.colors.textTertiary} />}
          </View>
          <View style={styles.propInfo}>
            <Text style={[styles.propTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>{MOCK_PROPERTY.title}</Text>
            <View style={styles.addrRow}>
              <MapPin size={12} color={theme.colors.textTertiary} />
              <Text style={[styles.addrText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{MOCK_PROPERTY.address}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.secTitle, { color: theme.colors.textPrimary }]}>1. Selectează datele</Text>
          <CalendarSelector selectedDates={selectedDates} onDateSelect={handleDateSelect} availableDates={MOCK_AVAILABLE_DATES} maxSelections={3} />
        </View>
        
        {selectedDates.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.secTitle, { color: theme.colors.textPrimary }]}>2. Alege orele</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateTabs}>
              {selectedDates.map(date => (
                <TouchableOpacity key={date} style={[styles.dateTab, { backgroundColor: currentDate === date ? theme.colors.primary.main : theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => setCurrentDate(date)}>
                  <Text style={{ color: currentDate === date ? '#fff' : theme.colors.textSecondary, fontWeight: '600' }}>{new Date(date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {currentDate && MOCK_SLOTS[currentDate] && (
              <TimeSlotPicker date={currentDate} availableSlots={MOCK_SLOTS[currentDate]} selectedSlots={selectedSlots.filter(s => s.date === currentDate)} onSlotSelect={handleSlotSelect} />
            )}
          </View>
        )}
        
        {selectedSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.secTitle, { color: theme.colors.textPrimary }]}>3. Mesaj (opțional)</Text>
            <View style={[styles.msgBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <MessageSquare size={18} color={theme.colors.textTertiary} />
              <TextInput style={[styles.msgInput, { color: theme.colors.textPrimary }]} placeholder="Mesaj pentru proprietar..." placeholderTextColor={theme.colors.textTertiary} value={message} onChangeText={setMessage} multiline />
            </View>
          </View>
        )}
        
        {selectedSlots.length > 0 && (
          <View style={[styles.info, { backgroundColor: theme.colors.accent.main + '15' }]}>
            <Info size={18} color={theme.colors.accent.main} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>Ai selectat {selectedSlots.length} slot(uri).</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Button title={selectedSlots.length > 0 ? `Trimite (${selectedSlots.length})` : 'Selectează'} onPress={handleSubmit} loading={isLoading} disabled={selectedSlots.length === 0} fullWidth />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  propCard: { flexDirection: 'row', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  propImg: { width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  propInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  propTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addrText: { fontSize: 13, flex: 1 },
  section: { marginBottom: 24 },
  secTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  dateTabs: { marginBottom: 12 },
  dateTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginRight: 8 },
  msgBox: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, borderWidth: 1, padding: 14, minHeight: 80, gap: 10 },
  msgInput: { flex: 1, fontSize: 15 },
  info: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 10 },
  infoText: { fontSize: 14 },
  footer: { padding: 16, borderTopWidth: 1 },
});

export default RequestViewingScreen;
