/**
 * RIVA - Request Viewing Screen
 * Allows seekers to request a property viewing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { CalendarSelector, TimeSlotPicker } from '../components';
import { Button, ScreenHeader } from '@/shared/components';
import { TimeSlot } from '../types';
import { Home, MapPin, MessageSquare, Info } from 'lucide-react-native';
import { useRequestViewing, useRescheduleViewing, useViewingAvailability } from '../hooks/useViewings';
import { useViewing } from '../hooks/useViewings';
import { getPropertyDetail } from '@/features/properties/api/propertiesApi';

type RequestViewingRouteProp = RouteProp<ProfileStackParamList, 'RequestViewing'>;

const RequestViewingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RequestViewingRouteProp>();
  const { theme } = useTheme();
  
  const { propertyId, viewingId } = route.params;
  const isReschedule = !!viewingId;
  
  const [property, setProperty] = useState<any>(null);
  const [existingViewing, setExistingViewing] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [message, setMessage] = useState('');
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(true);
  
  const requestMutation = useRequestViewing();
  const rescheduleMutation = useRescheduleViewing();
  const { data: viewingData } = useViewing(viewingId);
  const { data: availabilityData, isLoading: isLoadingAvailability } = useViewingAvailability(
    propertyId,
    undefined,
    undefined
  );
  
  // Fetch property
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoadingProperty(true);
        const prop = await getPropertyDetail(propertyId);
        setProperty(prop);
      } catch (error) {
        Alert.alert('Eroare', 'Nu s-a putut încărca proprietatea', [
          { text: 'OK', onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        ]);
      } finally {
        setIsLoadingProperty(false);
      }
    };
    fetchProperty();
  }, [propertyId]);
  
  // Pre-populate if reschedule
  useEffect(() => {
    if (isReschedule && viewingData) {
      setExistingViewing(viewingData);
      const slot = viewingData.confirmedSlot || viewingData.requestedSlots[0];
      if (slot) {
        setSelectedDates([slot.date]);
        setSelectedSlots([slot]);
        setCurrentDate(slot.date);
      }
      if (viewingData.notes) {
        setMessage(viewingData.notes);
      }
    }
  }, [isReschedule, viewingData]);
  
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
    
    // Validate slot is in the future
    const firstSlot = selectedSlots[0];
    const slotDateTime = new Date(`${firstSlot.date}T${firstSlot.startTime}`);
    if (slotDateTime <= new Date()) {
      Alert.alert('Atenție', 'Slot-ul trebuie să fie în viitor.');
      return;
    }
    
    // Use first selected slot (backend currently supports single slot)
    const slot = selectedSlots[0];
    const slotISO = `${slot.date}T${slot.startTime}:00`;
    
    if (isReschedule && viewingId) {
      rescheduleMutation.mutate(
        {
          id: viewingId,
          newSlot: slotISO,
          reason: message || undefined,
        },
        {
          onSuccess: () => {
            Alert.alert('Succes', 'Vizionarea a fost reprogramată.', [
              { text: 'OK', onPress: () => {
                // Navigate back to ViewingDetail or Viewings list
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Viewings');
                }
              }},
            ]);
          },
          onError: (error: any) => {
            Alert.alert('Eroare', error?.message || 'Nu s-a putut reprograma vizionarea');
          },
        }
      );
    } else {
      requestMutation.mutate(
        {
          propertyId: parseInt(propertyId),
          slot: slotISO,
          notes: message || undefined,
        },
        {
          onSuccess: () => {
            Alert.alert('Succes', 'Cererea de vizionare a fost trimisă.', [
              { text: 'OK', onPress: () => {
                // Navigate back or to Viewings list
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Viewings');
                }
              }},
            ]);
          },
          onError: (error: any) => {
            Alert.alert('Eroare', error?.message || 'Nu s-a putut trimite cererea');
          },
        }
      );
    }
  };
  
  if (isLoadingProperty || !property) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader
        title={isReschedule ? 'Reprogramează vizionare' : 'Programează vizionare'}
        onBackPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Viewings');
          }
        }}
      />
      
      <ScrollView 
        style={styles.scroll} 
        horizontal={false}
        contentContainerStyle={[styles.scrollContent, { width: '100%' }]}
      >
        <View style={[styles.propCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.propImg, { backgroundColor: theme.colors.divider }]}>
            {property.mainImage || property.images?.[0] ? (
              <Image source={{ uri: property.mainImage || property.images[0] }} style={styles.img} />
            ) : (
              <Home size={28} color={theme.colors.textTertiary} />
            )}
          </View>
          <View style={styles.propInfo}>
            <Text style={[styles.propTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {property.title || 'Proprietate'}
            </Text>
            <View style={styles.addrRow}>
              <MapPin size={12} color={theme.colors.textTertiary} />
              <Text style={[styles.addrText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {property.address || property.addressText || ''}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.secTitle, { color: theme.colors.textPrimary }]}>1. Selectează data</Text>
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            Selectează o dată în viitor
          </Text>
          <CalendarSelector 
            selectedDates={selectedDates} 
            onDateSelect={handleDateSelect} 
            availableDates={availabilityData?.availableDates || []}
            maxSelections={1} // Backend currently supports single slot
          />
        </View>
        
        {selectedDates.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.secTitle, { color: theme.colors.textPrimary }]}>2. Alege ora</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateTabs}>
              {selectedDates.map(date => (
                <TouchableOpacity 
                  key={date} 
                  style={[
                    styles.dateTab, 
                    { 
                      backgroundColor: currentDate === date ? theme.colors.primary.main : theme.colors.surface, 
                      borderColor: theme.colors.border 
                    }
                  ]} 
                  onPress={() => setCurrentDate(date)}
                >
                  <Text style={{ color: currentDate === date ? '#fff' : theme.colors.textSecondary, fontWeight: '600' }}>
                    {new Date(date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {currentDate && (
              <TimeSlotPicker 
                date={currentDate} 
                availableSlots={
                  availabilityData?.availability[currentDate] || 
                  generateTimeSlots(currentDate) // Fallback to default if no API data
                } 
                selectedSlots={selectedSlots.filter(s => s.date === currentDate)} 
                onSlotSelect={handleSlotSelect} 
              />
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
        <Button 
          title={selectedSlots.length > 0 ? (isReschedule ? 'Reprogramează' : 'Trimite cerere') : 'Selectează slot'} 
          onPress={handleSubmit} 
          loading={requestMutation.isPending || rescheduleMutation.isPending} 
          disabled={selectedSlots.length === 0} 
          fullWidth 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32, width: '100%' },
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
  },
});

// Generate time slots for a date (9:00 - 18:00, every 30 minutes)
function generateTimeSlots(date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHourCalc = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      slots.push({
        date,
        startTime,
        endTime,
      });
    }
  }
  
  return slots;
}

export default RequestViewingScreen;
