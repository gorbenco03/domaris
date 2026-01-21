/**
 * IMOBI - Calendar Selector Component
 * For selecting dates when requesting viewings
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarSelectorProps {
  selectedDates: string[];
  onDateSelect: (date: string) => void;
  availableDates?: string[];
  maxSelections?: number;
  minDate?: Date;
  maxDate?: Date;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  selectedDates,
  onDateSelect,
  availableDates,
  maxSelections = 3,
  minDate = new Date(),
  maxDate,
}) => {
  const { theme } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const DAYS = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
  
  const monthYear = useMemo(() => {
    return currentMonth.toLocaleDateString('ro-RO', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [currentMonth]);
  
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week (0 = Sunday, so we convert to Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentMonth]);
  
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    
    if (availableDates && !availableDates.includes(dateStr)) {
      return false;
    }
    
    return true;
  };
  
  const isDateSelected = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.includes(dateStr);
  };
  
  const handleDatePress = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (!isDateAvailable(date)) return;
    
    if (isDateSelected(date)) {
      onDateSelect(dateStr);
    } else if (selectedDates.length < maxSelections) {
      onDateSelect(dateStr);
    }
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const canGoToPrevious = useMemo(() => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const today = new Date();
    return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1);
  }, [currentMonth]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={goToPreviousMonth}
          disabled={!canGoToPrevious}
          style={[styles.navButton, { opacity: canGoToPrevious ? 1 : 0.3 }]}
        >
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthYear, { color: theme.colors.textPrimary }]}>
          {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Days of week */}
      <View style={styles.daysOfWeek}>
        {DAYS.map((day, index) => (
          <View key={index} style={styles.dayOfWeekCell}>
            <Text style={[styles.dayOfWeekText, { color: theme.colors.textTertiary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          
          const available = isDateAvailable(date);
          const selected = isDateSelected(date);
          
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dayCell,
                selected && { backgroundColor: theme.colors.accent.main },
                available && !selected && { backgroundColor: theme.colors.divider },
                !available && { opacity: 0.3 },
              ]}
              onPress={() => handleDatePress(date)}
              disabled={!available}
            >
              <Text style={[
                styles.dayText,
                { color: selected ? theme.colors.surface : theme.colors.textPrimary },
                !available && { color: theme.colors.textTertiary },
              ]}>
                {date.getDate()}
              </Text>
              {available && (
                <View style={[
                  styles.availableDot,
                  { backgroundColor: selected ? theme.colors.surface : theme.colors.accent.main }
                ]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Selected dates info */}
      {selectedDates.length > 0 && (
        <View style={[styles.selectedInfo, { borderTopColor: theme.colors.divider }]}>
          <Text style={[styles.selectedLabel, { color: theme.colors.textSecondary }]}>
            Date selectate ({selectedDates.length}/{maxSelections}):
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedList}>
            {selectedDates.map(dateStr => {
              const date = new Date(dateStr);
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.selectedChip, { backgroundColor: theme.colors.accent.main }]}
                  onPress={() => onDateSelect(dateStr)}
                >
                  <Text style={[styles.selectedChipText, { color: theme.colors.surface }]}>
                    {date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
  },
  daysOfWeek: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  availableDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  selectedInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  selectedLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  selectedList: {
    flexDirection: 'row',
  },
  selectedChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedChipText: {
    // color applied dynamically
    fontSize: 13,
    fontWeight: '500',
  },
});

export default CalendarSelector;
