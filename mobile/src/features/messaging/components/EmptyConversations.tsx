/**
 * RIVA - Empty Conversations Component
 * Empty state display when no conversations match the filter
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MessageCircle, Inbox, Archive } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ConversationFilter } from '../types';
import Button from '@/shared/components/Button';

// ============================================
// TYPES
// ============================================

interface EmptyConversationsProps {
  filter: ConversationFilter;
  onSearchProperties?: () => void;
}

// ============================================
// COMPONENT
// ============================================

const EmptyConversations: React.FC<EmptyConversationsProps> = ({
  filter,
  onSearchProperties,
}) => {
  const { theme } = useTheme();

  const getContent = () => {
    switch (filter) {
      case 'unread':
        return {
          icon: <Inbox size={64} color={theme.colors.textTertiary} strokeWidth={1.5} />,
          title: 'Niciun mesaj necitit',
          description: 'Ești la zi cu toate conversațiile tale.',
        };
      case 'archived':
        return {
          icon: <Archive size={64} color={theme.colors.textTertiary} strokeWidth={1.5} />,
          title: 'Nicio conversație arhivată',
          description: 'Conversațiile arhivate vor apărea aici.',
        };
      default:
        return {
          icon: <MessageCircle size={64} color={theme.colors.textTertiary} strokeWidth={1.5} />,
          title: 'Nicio conversație încă',
          description: 'Contactează proprietarii pentru a începe o conversație despre proprietățile care te interesează.',
          showAction: true,
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${theme.colors.primary.main}08` },
        ]}
      >
        {content.icon}
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          { color: theme.colors.textPrimary },
        ]}
      >
        {content.title}
      </Text>

      {/* Description */}
      <Text
        style={[
          styles.description,
          { color: theme.colors.textSecondary },
        ]}
      >
        {content.description}
      </Text>

      {/* Action button */}
      {content.showAction && onSearchProperties && (
        <View style={styles.buttonContainer}>
          <Button
            title="Caută proprietăți"
            onPress={onSearchProperties}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 200,
  },
});

export default EmptyConversations;
