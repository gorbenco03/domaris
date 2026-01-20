import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Card } from '@/shared/components/Card';
import { 
  BarChart2, 
  ChevronRight, 
  Eye, 
  MessageSquare, 
  Calendar,
  Trophy,
  AlertTriangle
} from 'lucide-react-native';
import { useOwnerAnalyticsSummary } from '../hooks/useAnalytics';

export const OwnerDashboardWidget: React.FC<{ onPressDetails?: () => void }> = ({ 
  onPressDetails 
}) => {
  const { theme } = useTheme();
  const { summary, loading } = useOwnerAnalyticsSummary();

  if (loading || !summary) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <BarChart2 size={20} color={theme.colors.primary.main} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Sumar anunțuri (luna aceasta)
          </Text>
        </View>
        <TouchableOpacity onPress={onPressDetails}>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
            {summary.totalViews.toLocaleString()}
          </Text>
          <View style={styles.statLabelContainer}>
            <Eye size={12} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Vizualizări</Text>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
            {summary.totalContacts}
          </Text>
          <View style={styles.statLabelContainer}>
            <MessageSquare size={12} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Contacte</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
            {summary.scheduledViewings}
          </Text>
          <View style={styles.statLabelContainer}>
            <Calendar size={12} color={theme.colors.textSecondary} style={styles.statIcon} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Vizionări</Text>
          </View>
        </View>
      </View>

      <View style={[styles.highlightSection, { borderTopColor: theme.colors.divider }]}>
        <View style={styles.highlightRow}>
          <Trophy size={16} color={theme.colors.secondary.warning} />
          <Text style={[styles.highlightText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            Cel mai performant: <Text style={[styles.highlightValue, { color: theme.colors.textPrimary }]}>{summary.topPerforming.title}</Text>
          </Text>
        </View>
        
        <View style={styles.highlightRow}>
          <AlertTriangle size={16} color={theme.colors.secondary.error} />
          <Text style={[styles.highlightText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            Necesită atenție: <Text style={[styles.highlightValue, { color: theme.colors.textPrimary }]}>{summary.needsAttention.title}</Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.footerButton, { backgroundColor: theme.colors.primary.main + '10' }]}
        onPress={onPressDetails}
      >
        <Text style={[styles.footerButtonText, { color: theme.colors.primary.main }]}>
          Vezi toate statisticile
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 30,
  },
  highlightSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    fontSize: 13,
    flex: 1,
  },
  highlightValue: {
    fontWeight: '600',
  },
  footerButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
