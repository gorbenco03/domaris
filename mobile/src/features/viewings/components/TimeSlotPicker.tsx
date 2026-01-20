/**
 * IMOBI - Time Slot Picker Component
 * For selecting available time slots
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Clock, Check } from 'lucide-react-native';
import { TimeSlot } from '../types';

interface SimpleTimeSlot {
  startTime: string;
  endTime: string;
}

interface TimeSlotPickerProps {
  date: string;
  availableSlots: SimpleTimeSlot[];
  selectedSlots: TimeSlot[];
  onSlotSelect: (slot: TimeSlot) => void;
  maxSelections?: number;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  date,
  availableSlots,
  selectedSlots,
  onSlotSelect,
  maxSelections = 2,
}) => {
  const { theme } = useTheme();
  
  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };
  
  const isSlotSelected = (slot: SimpleTimeSlot): boolean => {
    return selectedSlots.some(
      s => s.startTime === slot.startTime && s.endTime === slot.endTime
    );
  };
  
  const handleSlotPress = (slot: SimpleTimeSlot) => {
    const selected = isSlotSelected(slot);
    const fullSlot: TimeSlot = { date, startTime: slot.startTime, endTime: slot.endTime };
    
    if (selected) {
      onSlotSelect(fullSlot);
    } else if (selectedSlots.length < maxSelections) {
      onSlotSelect(fullSlot);
    }
  };
  
  // Group slots by morning/afternoon/evening
  const groupedSlots = React.useMemo(() => {
    const groups: { morning: SimpleTimeSlot[]; afternoon: SimpleTimeSlot[]; evening: SimpleTimeSlot[] } = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    
    availableSlots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0], 10);
      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 18) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
    });
    
    return groups;
  }, [availableSlots]);

  const renderSlotGroup = (title: string, slots: SimpleTimeSlot[], icon: string) => {
    if (slots.length === 0) return null;
    
    return (
      <View style={styles.slotGroup}>
        <Text style={[styles.groupTitle, { color: theme.colors.textSecondary }]}>
          {title}
        </Text>
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
                      ? theme.colors.accent.main 
                      : theme.colors.divider,
                    borderColor: selected 
                      ? theme.colors.accent.main 
                      : theme.colors.border,
                  },
                ]}
                onPress={() => handleSlotPress(slot)}
              >
                {selected ? (
                  <Check size={14} color="#fff" />
                ) : (
                  <Clock size={14} color={theme.colors.textSecondary} />
                )}
                <Text style={[
                  styles.slotText,
                  { color: selected ? '#fff' : theme.colors.textPrimary },
                ]}>
                  {slot.startTime}-{slot.endTime}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Date Header */}
      <View style={styles.header}>
        <Text style={[styles.dateText, { color: theme.colors.textPrimary }]}>
          {formatDate(date).charAt(0).toUpperCase() + formatDate(date).slice(1)}
        </Text>
        <Text style={[styles.selectHint, { color: theme.colors.textTertiary }]}>
          Selectează max {maxSelections} sloturi
        </Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderSlotGroup('🌅 Dimineață', groupedSlots.morning, 'sunrise')}
        {renderSlotGroup('☀️ Amiază', groupedSlots.afternoon, 'sun')}
        {renderSlotGroup('🌙 Seară', groupedSlots.evening, 'moon')}
        
        {availableSlots.length === 0 && (
          <View style={styles.emptyState}>
            <Clock size={32} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Nu există sloturi disponibile
            </Text>
            <Text style={[styles.emptyHint, { color: theme.colors.textTertiary }]}>
              Încercați o altă dată
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Selected summary */}
      {selectedSlots.length > 0 && (
        <View style={[styles.selectedSummary, { borderTopColor: theme.colors.divider }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Selectate:
          </Text>
          <View style={styles.selectedChips}>
            {selectedSlots.map((slot, index) => (
              <View 
                key={index}
                style={[styles.selectedChip, { backgroundColor: theme.colors.accent.main + '20' }]}
              >
                <Text style={[styles.chipText, { color: theme.colors.accent.main }]}>
                  {slot.startTime}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: 400,
  },
  header: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectHint: {
    fontSize: 13,
  },
  slotGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 4,
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  selectedChips: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  selectedChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default TimeSlotPicker;
