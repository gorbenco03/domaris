import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Card } from '@/shared/components/Card';
import { 
  Camera, 
  DollarSign, 
  FileText, 
  Calendar,
  ChevronRight,
  AlertCircle,
  LucideIcon
} from 'lucide-react-native';

interface SuggestionCardProps {
  type: "photos" | "price" | "description" | "availability";
  priority: "high" | "medium" | "low";
  message: string;
  description: string;
  action?: string;
  onAction?: () => void;
}

const getIcon = (type: string): LucideIcon => {
  switch (type) {
    case 'photos': return Camera;
    case 'price': return DollarSign;
    case 'description': return FileText;
    case 'availability': return Calendar;
    default: return AlertCircle;
  }
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  type,
  priority,
  message,
  description,
  action,
  onAction
}) => {
  const { theme } = useTheme();
  const Icon = getIcon(type);

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return theme.colors.secondary.error;
      case 'medium': return theme.colors.secondary.warning;
      case 'low': return theme.colors.secondary.info;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: `${getPriorityColor()}15` }]}>
          <Icon size={24} color={getPriorityColor()} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.message, { color: theme.colors.textPrimary }]}>{message}</Text>
            <View 
              style={[
                styles.priorityBadge, 
                { backgroundColor: `${getPriorityColor()}15` }
              ]}
            >
              <Text 
                style={[
                  styles.priorityText, 
                  { color: getPriorityColor() }
                ]}
              >
                {priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
          
          {action && (
            <TouchableOpacity 
              style={[styles.actionButton, { borderTopColor: theme.colors.divider }]} 
              onPress={onAction}
            >
              <Text style={[styles.actionText, { color: theme.colors.primary.main }]}>{action}</Text>
              <ChevronRight size={16} color={theme.colors.primary.main} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  container: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});
