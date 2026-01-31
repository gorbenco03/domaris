/**
 * RIVA - Calendar Selector Component
 * Modern, intuitive date picker for viewing requests
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';

interface CalendarSelectorProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  availableDates?: string[];
  minDate?: Date;
  maxDate?: Date;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Format date to YYYY-MM-DD without timezone issues
 */
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  selectedDate,
  onDateSelect,
  availableDates,
  minDate,
  maxDate,
}) => {
  const { theme } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const DAYS = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
  const MONTHS = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  const monthYear = useMemo(() => {
    return `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  }, [currentMonth]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week (0 = Sunday, convert to Monday = 0)
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

  const isDateAvailable = useCallback((date: Date): boolean => {
    // Past dates are not available
    if (date < today) return false;

    // Check min/max bounds
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;

    // If availableDates is provided and not empty, only allow those dates
    if (availableDates && availableDates.length > 0) {
      const dateStr = formatDateToString(date);
      return availableDates.includes(dateStr);
    }

    return true;
  }, [availableDates, minDate, maxDate, today]);

  const isDateSelected = useCallback((date: Date): boolean => {
    if (!selectedDate) return false;
    const dateStr = formatDateToString(date);
    return selectedDate === dateStr;
  }, [selectedDate]);

  const isToday = useCallback((date: Date): boolean => {
    return formatDateToString(date) === formatDateToString(today);
  }, [today]);

  const handleDatePress = (date: Date) => {
    if (!isDateAvailable(date)) return;
    const dateStr = formatDateToString(date);
    onDateSelect(dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const canGoToPrevious = useMemo(() => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1);
  }, [currentMonth, today]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          disabled={!canGoToPrevious}
          style={[
            styles.navButton,
            { backgroundColor: canGoToPrevious ? theme.colors.primary.main + '15' : 'transparent' }
          ]}
        >
          <ChevronLeft
            size={20}
            color={canGoToPrevious ? theme.colors.primary.main : theme.colors.textTertiary}
          />
        </TouchableOpacity>

        <View style={styles.monthYearContainer}>
          <Calendar size={18} color={theme.colors.primary.main} />
          <Text style={[styles.monthYear, { color: theme.colors.textPrimary }]}>
            {monthYear}
          </Text>
        </View>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.navButton, { backgroundColor: theme.colors.primary.main + '15' }]}
        >
          <ChevronRight size={20} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Days of week */}
      <View style={styles.daysOfWeek}>
        {DAYS.map((day, index) => (
          <View key={index} style={styles.dayOfWeekCell}>
            <Text style={[
              styles.dayOfWeekText,
              { color: index >= 5 ? theme.colors.secondary.error : theme.colors.textTertiary }
            ]}>
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
          const todayDate = isToday(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <TouchableOpacity
              key={formatDateToString(date)}
              style={[
                styles.dayCell,
                selected && [styles.selectedDay, { backgroundColor: theme.colors.primary.main }],
                todayDate && !selected && [styles.todayDay, { borderColor: theme.colors.primary.main }],
              ]}
              onPress={() => handleDatePress(date)}
              disabled={!available}
              activeOpacity={available ? 0.7 : 1}
            >
              <Text style={[
                styles.dayText,
                { color: theme.colors.textPrimary },
                selected && styles.selectedDayText,
                !available && { color: theme.colors.textTertiary, opacity: 0.4 },
                isWeekend && !selected && { color: theme.colors.secondary.error },
              ]}>
                {date.getDate()}
              </Text>
              {available && !selected && (
                <View style={[styles.availableDot, { backgroundColor: theme.colors.accent.main }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: theme.colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accent.main }]} />
          <Text style={[styles.legendText, { color: theme.colors.textTertiary }]}>Disponibil</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendToday, { borderColor: theme.colors.primary.main }]} />
          <Text style={[styles.legendText, { color: theme.colors.textTertiary }]}>Astăzi</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthYear: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
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
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  selectedDay: {
    borderRadius: 12,
  },
  selectedDayText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  todayDay: {
    borderRadius: 12,
    borderWidth: 2,
  },
  availableDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendToday: {
    width: 16,
    height: 16,
    borderRadius: 6,
    borderWidth: 2,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

export default CalendarSelector;
