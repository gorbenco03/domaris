/**
 * RIVA - Availability Settings Screen
 * Modern, fully functional availability management for property owners
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button, ScreenHeader } from '@/shared/components';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  CalendarX,
  Settings,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react-native';
import { DAYS_OF_WEEK, WeeklySlot } from '../types';

// Time options for pickers
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00
const MINUTES = [0, 30];

const formatTime = (hour: number, minute: number = 0): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Default availability template
const DEFAULT_SLOTS: WeeklySlot[] = [
  { dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '18:00' }] },
  { dayOfWeek: 2, slots: [{ startTime: '10:00', endTime: '14:00' }] },
  { dayOfWeek: 3, slots: [{ startTime: '09:00', endTime: '18:00' }] },
  { dayOfWeek: 4, slots: [] },
  { dayOfWeek: 5, slots: [{ startTime: '10:00', endTime: '16:00' }] },
  { dayOfWeek: 6, slots: [{ startTime: '10:00', endTime: '13:00' }] },
  { dayOfWeek: 0, slots: [] },
];

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  value: string;
  onSelect: (time: string) => void;
  onClose: () => void;
  theme: any;
  minTime?: string;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  title,
  value,
  onSelect,
  onClose,
  theme,
  minTime,
}) => {
  const [selectedHour, selectedMinute] = value.split(':').map(Number);
  const minHour = minTime ? parseInt(minTime.split(':')[0], 10) : 7;
  const minMinute = minTime ? parseInt(minTime.split(':')[1], 10) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.timeGrid} showsVerticalScrollIndicator={false}>
            {HOURS.map(hour => (
              <View key={hour}>
                {MINUTES.map(minute => {
                  const timeStr = formatTime(hour, minute);
                  const isDisabled = minTime && (hour < minHour || (hour === minHour && minute <= minMinute));
                  const isSelected = hour === selectedHour && minute === selectedMinute;

                  if (isDisabled) return null;

                  return (
                    <TouchableOpacity
                      key={`${hour}-${minute}`}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary.main
                            : theme.colors.background,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => {
                        onSelect(timeStr);
                        onClose();
                      }}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        { color: isSelected ? '#fff' : theme.colors.textPrimary },
                      ]}>
                        {timeStr}
                      </Text>
                      {isSelected && <Check size={18} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface DaySlot {
  startTime: string;
  endTime: string;
}

interface DayEditorProps {
  dayOfWeek: number;
  slots: DaySlot[];
  onUpdate: (slots: DaySlot[]) => void;
  theme: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const DayEditor: React.FC<DayEditorProps> = ({
  dayOfWeek,
  slots,
  onUpdate,
  theme,
  isExpanded,
  onToggleExpand,
}) => {
  const [timePickerConfig, setTimePickerConfig] = useState<{
    visible: boolean;
    type: 'start' | 'end';
    slotIndex: number;
    currentValue: string;
    minTime?: string;
  }>({
    visible: false,
    type: 'start',
    slotIndex: 0,
    currentValue: '09:00',
  });

  const dayInfo = DAYS_OF_WEEK.find(d => d.key === dayOfWeek)!;
  const isEnabled = slots.length > 0;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const toggleDay = () => {
    if (isEnabled) {
      onUpdate([]);
    } else {
      onUpdate([{ startTime: '09:00', endTime: '17:00' }]);
    }
  };

  const addSlot = () => {
    const lastSlot = slots[slots.length - 1];
    const lastEndHour = lastSlot ? parseInt(lastSlot.endTime.split(':')[0], 10) : 8;
    const newStart = formatTime(lastEndHour + 1);
    const newEnd = formatTime(lastEndHour + 3);
    onUpdate([...slots, { startTime: newStart, endTime: newEnd }]);
  };

  const removeSlot = (index: number) => {
    onUpdate(slots.filter((_, i) => i !== index));
  };

  const updateSlotTime = (index: number, type: 'start' | 'end', time: string) => {
    const newSlots = [...slots];
    if (type === 'start') {
      newSlots[index].startTime = time;
      // Auto-adjust end time if needed
      const startHour = parseInt(time.split(':')[0], 10);
      const endHour = parseInt(newSlots[index].endTime.split(':')[0], 10);
      if (endHour <= startHour) {
        newSlots[index].endTime = formatTime(startHour + 2);
      }
    } else {
      newSlots[index].endTime = time;
    }
    onUpdate(newSlots);
  };

  const openTimePicker = (slotIndex: number, type: 'start' | 'end') => {
    const slot = slots[slotIndex];
    setTimePickerConfig({
      visible: true,
      type,
      slotIndex,
      currentValue: type === 'start' ? slot.startTime : slot.endTime,
      minTime: type === 'end' ? slot.startTime : undefined,
    });
  };

  return (
    <View style={[styles.dayCard, { backgroundColor: theme.colors.surface }]}>
      {/* Day Header */}
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.dayHeaderLeft}>
          <View style={[
            styles.dayIndicator,
            {
              backgroundColor: isEnabled
                ? theme.colors.primary.main
                : theme.colors.border,
            },
          ]}>
            {isEnabled ? (
              <Check size={14} color="#fff" />
            ) : (
              <X size={14} color={theme.colors.textTertiary} />
            )}
          </View>
          <View>
            <Text style={[
              styles.dayName,
              { color: theme.colors.textPrimary },
              isWeekend && { color: theme.colors.secondary?.error || '#ef4444' }
            ]}>
              {dayInfo.full}
            </Text>
            <Text style={[styles.dayStatus, { color: theme.colors.textTertiary }]}>
              {isEnabled
                ? `${slots.length} interval${slots.length !== 1 ? 'e' : ''}`
                : 'Indisponibil'}
            </Text>
          </View>
        </View>

        <View style={styles.dayHeaderRight}>
          {isEnabled && slots.length > 0 && (
            <View style={[styles.quickPreview, { backgroundColor: theme.colors.primary.main + '15' }]}>
              <Text style={[styles.quickPreviewText, { color: theme.colors.primary.main }]}>
                {slots[0].startTime} - {slots[slots.length - 1].endTime}
              </Text>
            </View>
          )}
          <ChevronDown
            size={20}
            color={theme.colors.textTertiary}
            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={[styles.dayContent, { borderTopColor: theme.colors.border }]}>
          {/* Toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, {
              backgroundColor: isEnabled ? theme.colors.primary.main + '10' : theme.colors.background
            }]}
            onPress={toggleDay}
          >
            <View style={[
              styles.toggleTrack,
              { backgroundColor: isEnabled ? theme.colors.primary.main : theme.colors.border }
            ]}>
              <View style={[
                styles.toggleThumb,
                { left: isEnabled ? 22 : 2 }
              ]} />
            </View>
            <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>
              {isEnabled ? 'Disponibil pentru vizionări' : 'Marcat ca indisponibil'}
            </Text>
          </TouchableOpacity>

          {/* Time Slots */}
          {isEnabled && (
            <View style={styles.slotsSection}>
              {slots.map((slot, index) => (
                <View key={index} style={[styles.slotRow, { backgroundColor: theme.colors.background }]}>
                  <View style={styles.slotTimes}>
                    <TouchableOpacity
                      style={[styles.timeButton, { borderColor: theme.colors.border }]}
                      onPress={() => openTimePicker(index, 'start')}
                    >
                      <Text style={[styles.timeButtonText, { color: theme.colors.textPrimary }]}>
                        {slot.startTime}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.timeSeparator, { color: theme.colors.textTertiary }]}>→</Text>

                    <TouchableOpacity
                      style={[styles.timeButton, { borderColor: theme.colors.border }]}
                      onPress={() => openTimePicker(index, 'end')}
                    >
                      <Text style={[styles.timeButtonText, { color: theme.colors.textPrimary }]}>
                        {slot.endTime}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeSlotBtn}
                    onPress={() => removeSlot(index)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Slot Button */}
              <TouchableOpacity
                style={[styles.addSlotBtn, { borderColor: theme.colors.border }]}
                onPress={addSlot}
              >
                <Plus size={18} color={theme.colors.primary.main} />
                <Text style={[styles.addSlotText, { color: theme.colors.primary.main }]}>
                  Adaugă interval
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={timePickerConfig.visible}
        title={timePickerConfig.type === 'start' ? 'Ora de început' : 'Ora de sfârșit'}
        value={timePickerConfig.currentValue}
        minTime={timePickerConfig.minTime}
        onSelect={(time) => updateSlotTime(timePickerConfig.slotIndex, timePickerConfig.type, time)}
        onClose={() => setTimePickerConfig(prev => ({ ...prev, visible: false }))}
        theme={theme}
      />
    </View>
  );
};

const AvailabilitySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>(DEFAULT_SLOTS);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(15);
  const [advanceDays, setAdvanceDays] = useState(2);
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-01-26', '2026-02-14']);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettingsPicker, setShowSettingsPicker] = useState<{
    visible: boolean;
    type: 'duration' | 'buffer' | 'advance' | 'max';
  }>({ visible: false, type: 'duration' });

  const updateDaySlots = useCallback((dayOfWeek: number, slots: DaySlot[]) => {
    setWeeklySlots(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, slots } : day))
    );
  }, []);

  const toggleExpandDay = (dayOfWeek: number) => {
    setExpandedDay(prev => (prev === dayOfWeek ? null : dayOfWeek));
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    Alert.alert('Salvat! ✓', 'Disponibilitatea ta a fost actualizată cu succes.');
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(prev => prev.filter(d => d !== date));
  };

  const addBlockedDate = () => {
    // In a real app, this would open a date picker
    Alert.alert(
      'Blochează o zi',
      'Selectează o dată din calendar',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Mâine',
          onPress: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            if (!blockedDates.includes(dateStr)) {
              setBlockedDates(prev => [...prev, dateStr]);
            }
          }
        },
      ]
    );
  };

  const formatBlockedDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Settings options
  const settingsOptions = {
    duration: [15, 30, 45, 60, 90],
    buffer: [0, 10, 15, 30, 45],
    advance: [1, 2, 3, 5, 7],
    max: [2, 3, 5, 8, 10],
  };

  const getSettingValue = () => {
    switch (showSettingsPicker.type) {
      case 'duration': return duration;
      case 'buffer': return buffer;
      case 'advance': return advanceDays;
      case 'max': return maxPerDay;
    }
  };

  const setSettingValue = (value: number) => {
    switch (showSettingsPicker.type) {
      case 'duration': setDuration(value); break;
      case 'buffer': setBuffer(value); break;
      case 'advance': setAdvanceDays(value); break;
      case 'max': setMaxPerDay(value); break;
    }
    setShowSettingsPicker({ ...showSettingsPicker, visible: false });
  };

  // Sort days starting from Monday
  const sortedDays = [...weeklySlots].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
    return order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScreenHeader
        title="Disponibilitate"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: theme.colors.primary.main + '10' }]}>
          <AlertCircle size={20} color={theme.colors.primary.main} />
          <Text style={[styles.infoBannerText, { color: theme.colors.textSecondary }]}>
            Setează orele când ești disponibil pentru vizionări. Vizitatorii pot rezerva doar în intervalele tale.
          </Text>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={20} color={theme.colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Program săptămânal
            </Text>
          </View>

          {sortedDays.map(day => (
            <DayEditor
              key={day.dayOfWeek}
              dayOfWeek={day.dayOfWeek}
              slots={day.slots}
              onUpdate={(slots) => updateDaySlots(day.dayOfWeek, slots)}
              theme={theme}
              isExpanded={expandedDay === day.dayOfWeek}
              onToggleExpand={() => toggleExpandDay(day.dayOfWeek)}
            />
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Settings size={20} color={theme.colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Setări vizionări
            </Text>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => setShowSettingsPicker({ visible: true, type: 'duration' })}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#10b981' + '20' }]}>
                  <Clock size={18} color="#10b981" />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                    Durată vizionare
                  </Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textTertiary }]}>
                    Cât durează o vizionare
                  </Text>
                </View>
              </View>
              <View style={[styles.settingValue, { backgroundColor: theme.colors.primary.main + '15' }]}>
                <Text style={[styles.settingValueText, { color: theme.colors.primary.main }]}>
                  {duration} min
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => setShowSettingsPicker({ visible: true, type: 'buffer' })}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#f59e0b' + '20' }]}>
                  <Sun size={18} color="#f59e0b" />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                    Pauză între vizionări
                  </Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textTertiary }]}>
                    Timp liber între programări
                  </Text>
                </View>
              </View>
              <View style={[styles.settingValue, { backgroundColor: theme.colors.primary.main + '15' }]}>
                <Text style={[styles.settingValueText, { color: theme.colors.primary.main }]}>
                  {buffer} min
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => setShowSettingsPicker({ visible: true, type: 'advance' })}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#6366f1' + '20' }]}>
                  <Calendar size={18} color="#6366f1" />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                    Rezervare în avans
                  </Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textTertiary }]}>
                    Minimum zile înainte
                  </Text>
                </View>
              </View>
              <View style={[styles.settingValue, { backgroundColor: theme.colors.primary.main + '15' }]}>
                <Text style={[styles.settingValueText, { color: theme.colors.primary.main }]}>
                  {advanceDays} zile
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRowLast}
              onPress={() => setShowSettingsPicker({ visible: true, type: 'max' })}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#ec4899' + '20' }]}>
                  <Moon size={18} color="#ec4899" />
                </View>
                <View>
                  <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                    Maximum pe zi
                  </Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textTertiary }]}>
                    Vizionări maxime zilnic
                  </Text>
                </View>
              </View>
              <View style={[styles.settingValue, { backgroundColor: theme.colors.primary.main + '15' }]}>
                <Text style={[styles.settingValueText, { color: theme.colors.primary.main }]}>
                  {maxPerDay}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Blocked Dates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <CalendarX size={20} color="#ef4444" />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Zile blocate
            </Text>
            <TouchableOpacity
              style={[styles.addBlockedBtn, { backgroundColor: '#ef4444' + '15' }]}
              onPress={addBlockedDate}
            >
              <Plus size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={[styles.blockedCard, { backgroundColor: theme.colors.surface }]}>
            {blockedDates.length === 0 ? (
              <View style={styles.emptyBlocked}>
                <CalendarX size={32} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyBlockedText, { color: theme.colors.textTertiary }]}>
                  Nu ai zile blocate
                </Text>
                <Text style={[styles.emptyBlockedHint, { color: theme.colors.textTertiary }]}>
                  Adaugă zile când nu ești disponibil
                </Text>
              </View>
            ) : (
              blockedDates.map((date, index) => (
                <View
                  key={date}
                  style={[
                    styles.blockedRow,
                    index < blockedDates.length - 1 && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }
                  ]}
                >
                  <View style={styles.blockedInfo}>
                    <CalendarX size={16} color="#ef4444" />
                    <Text style={[styles.blockedDate, { color: theme.colors.textPrimary }]}>
                      {formatBlockedDate(date)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBlockedBtn}
                    onPress={() => removeBlockedDate(date)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Button
          title="Salvează disponibilitatea"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
        />
      </View>

      {/* Settings Picker Modal */}
      <Modal visible={showSettingsPicker.visible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSettingsPicker({ ...showSettingsPicker, visible: false })}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {showSettingsPicker.type === 'duration' && 'Durată vizionare'}
                {showSettingsPicker.type === 'buffer' && 'Pauză între vizionări'}
                {showSettingsPicker.type === 'advance' && 'Rezervare în avans'}
                {showSettingsPicker.type === 'max' && 'Maximum vizionări/zi'}
              </Text>
              <TouchableOpacity onPress={() => setShowSettingsPicker({ ...showSettingsPicker, visible: false })}>
                <X size={24} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsGrid}>
              {settingsOptions[showSettingsPicker.type].map(value => {
                const isSelected = value === getSettingValue();
                const label = showSettingsPicker.type === 'advance'
                  ? `${value} ${value === 1 ? 'zi' : 'zile'}`
                  : showSettingsPicker.type === 'max'
                    ? `${value} vizionări`
                    : `${value} minute`;

                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.optionBtn,
                      {
                        backgroundColor: isSelected ? theme.colors.primary.main : theme.colors.background,
                        borderColor: isSelected ? theme.colors.primary.main : theme.colors.border,
                      }
                    ]}
                    onPress={() => setSettingValue(value)}
                  >
                    <Text style={[
                      styles.optionBtnText,
                      { color: isSelected ? '#fff' : theme.colors.textPrimary }
                    ]}>
                      {label}
                    </Text>
                    {isSelected && <Check size={16} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },

  // Day Card
  dayCard: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  dayStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  quickPreview: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickPreviewText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  dayContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },

  // Slots
  slotsSection: {
    marginTop: 12,
    gap: 10,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  slotTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  timeSeparator: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  removeSlotBtn: {
    padding: 8,
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addSlotText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },

  // Settings Card
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  settingRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  settingHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  settingValue: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settingValueText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },

  // Blocked Dates
  addBlockedBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyBlocked: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyBlockedText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
  },
  emptyBlockedHint: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  blockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockedDate: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  removeBlockedBtn: {
    padding: 4,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  timeGrid: {
    padding: 16,
    maxHeight: 300,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  optionsGrid: {
    padding: 16,
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
});

export default AvailabilitySettingsScreen;
