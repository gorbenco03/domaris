/**
 * IMOBI - Quick Filters Component
 * Common quick-access filters for search
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Sparkles,
  Clock,
  TrendingDown,
  CheckCircle,
  MapPin,
} from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';

// ============================================
// TYPES
// ============================================

type QuickFilterId = 'new' | 'priceDropped' | 'verified' | 'nearby' | 'recommended';

interface QuickFilter {
  id: QuickFilterId;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface QuickFiltersProps {
  selectedFilters: QuickFilterId[];
  onFilterToggle: (filterId: QuickFilterId) => void;
}

// ============================================
// COMPONENT
// ============================================

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  selectedFilters,
  onFilterToggle,
}) => {
  const { theme } = useTheme();

  const filters: QuickFilter[] = [
    {
      id: 'recommended',
      label: 'Recomandate AI',
      icon: <Sparkles size={18} color={theme.colors.secondary.main} />,
      color: theme.colors.secondary.main,
    },
    {
      id: 'new',
      label: 'Noi (7 zile)',
      icon: <Clock size={18} color={theme.colors.accent.main} />,
      color: theme.colors.accent.main,
    },
    {
      id: 'priceDropped',
      label: 'Preț redus',
      icon: <TrendingDown size={18} color={theme.colors.secondary.warning} />,
      color: theme.colors.secondary.warning,
    },
    {
      id: 'verified',
      label: 'Proprietari verificați',
      icon: <CheckCircle size={18} color={theme.colors.primary.main} />,
      color: theme.colors.primary.main,
    },
    {
      id: 'nearby',
      label: 'În apropiere',
      icon: <MapPin size={18} color={theme.colors.secondary.info} />,
      color: theme.colors.secondary.info,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
        Filtre rapide
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => {
          const isSelected = selectedFilters.includes(filter.id);
          
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isSelected 
                    ? `${filter.color}15` 
                    : theme.colors.surface,
                  borderColor: isSelected 
                    ? filter.color 
                    : theme.colors.border,
                },
              ]}
              onPress={() => onFilterToggle(filter.id)}
              activeOpacity={0.7}
            >
              {React.cloneElement(filter.icon as React.ReactElement, {
                color: isSelected ? filter.color : theme.colors.textSecondary,
              })}
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color: isSelected ? filter.color : theme.colors.textSecondary,
                    fontFamily: isSelected ? 'Inter-SemiBold' : 'Inter-Medium',
                  },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 10,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
  },
});

export default QuickFilters;
