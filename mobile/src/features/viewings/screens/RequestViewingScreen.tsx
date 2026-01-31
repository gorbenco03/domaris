/**
 * RIVA - Request Viewing Screen
 * Modern, intuitive UI for scheduling property viewings
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ProfileStackParamList } from '@/app/navigation/types';
import { CalendarSelector, TimeSlotPicker } from '../components';
import { Button, ScreenHeader } from '@/shared/components';
import { TimeSlot } from '../types';
import {
  Home,
  MapPin,
  MessageSquare,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  Send,
  RefreshCw,
  Euro,
} from 'lucide-react-native';
import { useRequestViewing, useRescheduleViewing, useViewingAvailability } from '../hooks/useViewings';
import { useViewing } from '../hooks/useViewings';
import { getPropertyDetail } from '@/features/properties/api/propertiesApi';

type RequestViewingRouteProp = RouteProp<ProfileStackParamList, 'RequestViewing'>;

interface StepIndicatorProps {
  currentStep: number;
  theme: any;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, theme }) => {
  const steps = [
    { icon: Calendar, label: 'Data' },
    { icon: Clock, label: 'Ora' },
    { icon: Check, label: 'Confirmare' },
  ];

  return (
    <View style={styles.stepContainer}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={index}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                {
                  backgroundColor: isActive ? theme.colors.primary.main : theme.colors.surface,
                  borderColor: isActive ? theme.colors.primary.main : theme.colors.border,
                },
                isCurrent && styles.stepCircleCurrent,
              ]}>
                <Icon
                  size={16}
                  color={isActive ? '#fff' : theme.colors.textTertiary}
                />
              </View>
              <Text style={[
                styles.stepLabel,
                { color: isActive ? theme.colors.primary.main : theme.colors.textTertiary }
              ]}>
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                { backgroundColor: index < currentStep ? theme.colors.primary.main : theme.colors.border }
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const RequestViewingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RequestViewingRouteProp>();
  const { theme } = useTheme();

  const { propertyId, viewingId } = route.params;
  const isReschedule = !!viewingId;

  const [property, setProperty] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState(true);

  const requestMutation = useRequestViewing();
  const rescheduleMutation = useRescheduleViewing();
  const { data: viewingData } = useViewing(viewingId);
  const { data: availabilityData, isLoading: isLoadingAvailability } = useViewingAvailability(
    propertyId,
    undefined,
    undefined
  );

  // Calculate current step
  const currentStep = useMemo(() => {
    if (selectedSlot) return 2;
    if (selectedDate) return 1;
    return 0;
  }, [selectedDate, selectedSlot]);

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
      const slot = viewingData.confirmedSlot || viewingData.requestedSlots[0];
      if (slot) {
        setSelectedDate(slot.date);
        setSelectedSlot(slot);
      }
      if (viewingData.notes) {
        setMessage(viewingData.notes);
        setShowMessage(true);
      }
    }
  }, [isReschedule, viewingData]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // Reset slot when date changes
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot | null) => {
    setSelectedSlot(slot);
  };

  const formatDateDisplay = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      Alert.alert('Atenție', 'Selectează o oră pentru vizionare.');
      return;
    }

    // Validate slot is in the future
    const slotDateTime = new Date(`${selectedSlot.date}T${selectedSlot.startTime}`);
    if (slotDateTime <= new Date()) {
      Alert.alert('Atenție', 'Ora selectată trebuie să fie în viitor.');
      return;
    }

    const slotISO = `${selectedSlot.date}T${selectedSlot.startTime}:00`;

    if (isReschedule && viewingId) {
      rescheduleMutation.mutate(
        {
          id: viewingId,
          newSlot: slotISO,
          reason: message || undefined,
        },
        {
          onSuccess: () => {
            Alert.alert(
              'Reprogramare trimisă! ✓',
              'Proprietarul va fi notificat despre noua dată propusă.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
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
            Alert.alert(
              'Cerere trimisă! ✓',
              'Proprietarul va fi notificat și te va contacta pentru confirmare.',
              [{ text: 'Perfect', onPress: () => navigation.goBack() }]
            );
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
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Se încarcă...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader
        title={isReschedule ? 'Reprogramează' : 'Programează vizionare'}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Property Card - Compact & Elegant */}
          <View style={[styles.propertyCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.propertyImage, { backgroundColor: theme.colors.divider }]}>
              {property.mainImage || property.images?.[0] ? (
                <Image
                  source={{ uri: property.mainImage || property.images[0] }}
                  style={styles.image}
                />
              ) : (
                <Home size={24} color={theme.colors.textTertiary} />
              )}
            </View>
            <View style={styles.propertyInfo}>
              <Text style={[styles.propertyTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {property.title || 'Proprietate'}
              </Text>
              <View style={styles.propertyMeta}>
                <MapPin size={12} color={theme.colors.textTertiary} />
                <Text style={[styles.propertyAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {property.address || property.addressText || 'Adresă nedisponibilă'}
                </Text>
              </View>
              {property.price && (
                <View style={styles.priceRow}>
                  <Euro size={12} color={theme.colors.primary.main} />
                  <Text style={[styles.priceText, { color: theme.colors.primary.main }]}>
                    {property.price.toLocaleString('ro-RO')} €
                    {property.listingType === 'rent' ? '/lună' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} theme={theme} />

          {/* Calendar Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={theme.colors.primary.main} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Alege data vizionării
              </Text>
            </View>
            <CalendarSelector
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              availableDates={availabilityData?.availableDates}
            />
          </View>

          {/* Time Slot Section - Shows when date is selected */}
          {selectedDate && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color={theme.colors.primary.main} />
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Alege ora
                </Text>
              </View>
              <Text style={[styles.selectedDateText, { color: theme.colors.textSecondary }]}>
                {formatDateDisplay(selectedDate)}
              </Text>
              <TimeSlotPicker
                date={selectedDate}
                availableSlots={
                  availabilityData?.availability?.[selectedDate] ||
                  generateTimeSlots(selectedDate)
                }
                selectedSlot={selectedSlot}
                onSlotSelect={handleSlotSelect}
              />
            </View>
          )}

          {/* Message Section - Shows when slot is selected */}
          {selectedSlot && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.messageToggle, { backgroundColor: theme.colors.surface }]}
                onPress={() => setShowMessage(!showMessage)}
                activeOpacity={0.7}
              >
                <View style={styles.messageToggleLeft}>
                  <MessageSquare size={20} color={theme.colors.primary.main} />
                  <Text style={[styles.messageToggleText, { color: theme.colors.textPrimary }]}>
                    Adaugă un mesaj
                  </Text>
                </View>
                <View style={[
                  styles.messageToggleIndicator,
                  { backgroundColor: showMessage ? theme.colors.primary.main : theme.colors.border }
                ]}>
                  <Text style={[
                    styles.messageToggleIndicatorText,
                    { color: showMessage ? '#fff' : theme.colors.textTertiary }
                  ]}>
                    {showMessage ? '−' : '+'}
                  </Text>
                </View>
              </TouchableOpacity>

              {showMessage && (
                <View style={[styles.messageBox, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }]}>
                  <TextInput
                    style={[styles.messageInput, { color: theme.colors.textPrimary }]}
                    placeholder="Ex: Sunt disponibil și la alte ore dacă e nevoie..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}
            </View>
          )}

          {/* Summary Card - Shows when slot is selected */}
          {selectedSlot && (
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary.main + '10' }]}>
              <Text style={[styles.summaryTitle, { color: theme.colors.primary.main }]}>
                Rezumat programare
              </Text>
              <View style={styles.summaryRow}>
                <Calendar size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.summaryText, { color: theme.colors.textPrimary }]}>
                  {formatDateDisplay(selectedSlot.date)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Clock size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.summaryText, { color: theme.colors.textPrimary }]}>
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </Text>
              </View>
              {message && (
                <View style={styles.summaryRow}>
                  <MessageSquare size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    "{message}"
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View style={[styles.footer, {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.border
      }]}>
        <Button
          title={
            !selectedDate
              ? 'Selectează o dată'
              : !selectedSlot
                ? 'Selectează o oră'
                : isReschedule
                  ? 'Trimite cerere de reprogramare'
                  : 'Trimite cererea de vizionare'
          }
          onPress={handleSubmit}
          loading={requestMutation.isPending || rescheduleMutation.isPending}
          disabled={!selectedSlot}
          fullWidth
          icon={selectedSlot ? (isReschedule ? RefreshCw : Send) : undefined}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  flex1: {
    flex: 1,
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },

  // Property Card
  propertyCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  propertyImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  propertyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  propertyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },

  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleCurrent: {
    transform: [{ scale: 1.1 }],
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
    borderRadius: 1,
    marginBottom: 20,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  selectedDateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
    marginLeft: 30,
    textTransform: 'capitalize',
  },

  // Message Section
  messageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
  },
  messageToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageToggleText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  messageToggleIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageToggleIndicatorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  messageBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  messageInput: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
  },

  // Summary Card
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
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
