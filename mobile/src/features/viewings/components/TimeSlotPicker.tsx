/**
 * RIVA - Time Slot Picker Component
 * Clean, intuitive time slot selection with proper scrolling
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Check, Sun, Sunrise, Sunset } from 'lucide-react-native';
import { TimeSlot } from '../types';

interface SimpleTimeSlot {
  startTime: string;
  endTime: string;
}

interface TimeSlotPickerProps {
  date: string;
  availableSlots: SimpleTimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot | null) => void;
}

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
    // Toggle selection - if already selected, deselect
    if (isSlotSelected(slot)) {
      onSlotSelect(null);
    } else {
      onSlotSelect(fullSlot);
    }
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
                <Text style={[
                  styles.slotTime,
                  { color: selected ? '#fff' : theme.colors.textPrimary },
                ]}>
                  {slot.startTime}
                </Text>
                {selected && (
                  <View style={styles.checkBadge}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (availableSlots.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
          Fără disponibilitate
        </Text>
        <Text style={[styles.emptyHint, { color: theme.colors.textSecondary }]}>
          Nu există sloturi disponibile pentru această dată. Încearcă altă zi.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
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
        <Sunset size={16} color="#6366f1" />,
        '#e0e7ff'
      )}

      {/* Selected indicator at bottom */}
      {selectedSlot && selectedSlot.date === date && (
        <View style={[styles.selectedBar, { backgroundColor: theme.colors.primary.main + '15' }]}>
          <Check size={16} color={theme.colors.primary.main} />
          <Text style={[styles.selectedText, { color: theme.colors.primary.main }]}>
            Ora selectată: {selectedSlot.startTime} - {selectedSlot.endTime}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  slotGroup: {
    marginBottom: 16,
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
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  slotTime: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  selectedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default TimeSlotPicker;
