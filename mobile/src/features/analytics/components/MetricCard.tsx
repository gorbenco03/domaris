import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Card } from '@/shared/components/Card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  change,
  icon: Icon
}) => {
  const { theme } = useTheme();

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {Icon && <Icon size={20} color={theme.colors.textSecondary} />}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      </View>
      
      <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{value}</Text>
      
      {change !== undefined && (
        <View style={styles.changeContainer}>
          {isPositive ? (
            <TrendingUp size={14} color={theme.colors.accent.main} />
          ) : isNegative ? (
            <TrendingDown size={14} color={theme.colors.secondary.error} />
          ) : (
            <Minus size={14} color={theme.colors.textTertiary} />
          )}
          <Text 
            style={[
              styles.changeText, 
              { 
                color: isPositive 
                  ? theme.colors.accent.main 
                  : isNegative 
                    ? theme.colors.secondary.error 
                    : theme.colors.textTertiary 
              }
            ]}
          >
            {isPositive ? '+' : ''}{change}%
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    minWidth: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
