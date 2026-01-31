/**
 * RIVA - Time Slot Picker Component
 * Modern, user-friendly time slot selection
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Clock, Check, Sun, Sunrise, Moon } from 'lucide-react-native';
import { TimeSlot } from '../types';

interface SimpleTimeSlot {
  startTime: string;
  endTime: string;
}

interface TimeSlotPickerProps {
  date: string;
  availableSlots: SimpleTimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

/**
 * Format date string to readable Romanian format
 */
const formatDateDisplay = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const weekdays = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const months = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];

  return `${weekdays[date.getDay()]}, ${day} ${months[month - 1]}`;
};

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  date,
  availableSlots,
  selectedSlot,
  onSlotSelect,
}) => {
  const { theme } = useTheme();

  const isSlotSelected = (slot: SimpleTimeSlot): boolean => {
    if (!selectedSlot) return false;
    return selectedSlot.startTime === slot.startTime && selectedSlot.date === date;
  };

  const handleSlotPress = (slot: SimpleTimeSlot) => {
    const fullSlot: TimeSlot = { date, startTime: slot.startTime, endTime: slot.endTime };
    onSlotSelect(fullSlot);
  };

  // Group slots by time of day
  const groupedSlots = useMemo(() => {
    const groups: { morning: SimpleTimeSlot[]; afternoon: SimpleTimeSlot[]; evening: SimpleTimeSlot[] } = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    availableSlots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0], 10);
      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 17) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
    });

    return groups;
  }, [availableSlots]);

  const renderSlotGroup = (
    title: string,
    slots: SimpleTimeSlot[],
    icon: React.ReactNode,
    iconBgColor: string
  ) => {
    if (slots.length === 0) return null;

    return (
      <View style={styles.slotGroup}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupIconContainer, { backgroundColor: iconBgColor }]}>
            {icon}
          </View>
          <Text style={[styles.groupTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.groupCount, { color: theme.colors.textTertiary }]}>
            {slots.length} disponibile
          </Text>
        </View>
        <View style={styles.slotsGrid}>
          {slots.map((slot, index) => {
            const selected = isSlotSelected(slot);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.slotButton,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary.main
                      : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.primary.main
                      : theme.colors.border,
                  },
                ]}
                onPress={() => handleSlotPress(slot)}
                activeOpacity={0.7}
              >
                {selected && (
                  <View style={styles.checkIcon}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </View>
                )}
                <Text style={[
                  styles.slotTime,
                  { color: selected ? '#fff' : theme.colors.textPrimary },
                ]}>
                  {slot.startTime}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Date Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Clock size={20} color={theme.colors.primary.main} />
        <Text style={[styles.dateText, { color: theme.colors.textPrimary }]}>
          {formatDateDisplay(date)}
        </Text>
      </View>

      <ScrollView
        style={styles.slotsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.slotsContent}
      >
        {renderSlotGroup(
          'Dimineață',
          groupedSlots.morning,
          <Sunrise size={16} color="#f59e0b" />,
          '#fef3c7'
        )}
        {renderSlotGroup(
          'După-amiază',
          groupedSlots.afternoon,
          <Sun size={16} color="#f97316" />,
          '#ffedd5'
        )}
        {renderSlotGroup(
          'Seară',
          groupedSlots.evening,
          <Moon size={16} color="#6366f1" />,
          '#e0e7ff'
        )}

        {availableSlots.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.border }]}>
              <Clock size={32} color={theme.colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              Fără disponibilitate
            </Text>
            <Text style={[styles.emptyHint, { color: theme.colors.textSecondary }]}>
              Nu există sloturi disponibile pentru această dată. Încercați altă zi.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Selected slot indicator */}
      {selectedSlot && selectedSlot.date === date && (
        <View style={[styles.selectedBar, { backgroundColor: theme.colors.primary.main + '10' }]}>
          <Check size={18} color={theme.colors.primary.main} />
          <Text style={[styles.selectedText, { color: theme.colors.primary.main }]}>
            Ai selectat ora {selectedSlot.startTime}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  slotsContainer: {
    maxHeight: 350,
  },
  slotsContent: {
    padding: 16,
    paddingTop: 8,
  },
  slotGroup: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  groupIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  groupCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  slotTime: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  checkIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default TimeSlotPicker;
