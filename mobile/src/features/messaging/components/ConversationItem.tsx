/**
 * IMOBI - Conversation Item Component
 * Single conversation preview in the list
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Home, User } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Conversation } from '../types';
import { formatDistanceToNow } from '@/shared/utils/dateUtils';

// ============================================
// TYPES
// ============================================

interface ConversationItemProps {
  conversation: Conversation;
  onPress: (conversationId: string) => void;
}

// ============================================
// COMPONENT
// ============================================

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  const { theme } = useTheme();

  const hasUnread = conversation.unreadCount > 0;
  const avatarUrl = conversation.otherParticipant?.avatar;
  const participantName = conversation.otherParticipant?.name || 'Utilizator';
  const propertyTitle = conversation.property?.title || 'Proprietate';
  const lastMessageText = conversation.lastMessage?.content || '';
  const lastMessageTime = conversation.lastMessage?.createdAt 
    ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt))
    : '';

  // Truncate last message
  const truncatedMessage = lastMessageText.length > 40 
    ? `${lastMessageText.substring(0, 40)}...` 
    : lastMessageText;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: hasUnread 
            ? `${theme.colors.primary.main}08` 
            : theme.colors.surface,
          borderBottomColor: theme.colors.divider,
        },
      ]}
      onPress={() => onPress(conversation.id)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.avatar,
              {
                borderRadius: theme.borderRadius.full,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              {
                backgroundColor: theme.colors.primary.light,
                borderRadius: theme.borderRadius.full,
              },
            ]}
          >
            <User size={24} color="#ffffff" />
          </View>
        )}
        {/* Online indicator */}
        {conversation.otherParticipant?.isOnline && (
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: theme.colors.accent.main },
            ]}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.textPrimary,
                fontWeight: hasUnread ? '700' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {participantName}
          </Text>
          <Text
            style={[
              styles.time,
              {
                color: hasUnread 
                  ? theme.colors.primary.main 
                  : theme.colors.textTertiary,
                fontWeight: hasUnread ? '600' : '400',
              },
            ]}
          >
            {lastMessageTime}
          </Text>
        </View>

        {/* Property row */}
        <View style={styles.propertyRow}>
          <Home size={14} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.propertyTitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {propertyTitle}
          </Text>
        </View>

        {/* Message preview row */}
        <View style={styles.messageRow}>
          <Text
            style={[
              styles.messagePreview,
              {
                color: hasUnread 
                  ? theme.colors.textPrimary 
                  : theme.colors.textSecondary,
                fontWeight: hasUnread ? '500' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {truncatedMessage}
          </Text>
          {hasUnread && (
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.colors.primary.main },
              ]}
            >
              <Text style={styles.badgeText}>
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  propertyTitle: {
    fontSize: 13,
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ConversationItem;
