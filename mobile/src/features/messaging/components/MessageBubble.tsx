/**
 * RIVA - Message Bubble Component
 * Individual message display in chat
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Check, CheckCheck, Clock, AlertCircle, Calendar } from 'lucide-react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Message, MessageStatus } from '../types';

// ============================================
// TYPES
// ============================================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime?: boolean;
  onImagePress?: (imageUrl: string) => void;
  onViewingRequestPress?: (requestId: string) => void;
}

// ============================================
// STATUS ICON COMPONENT
// ============================================

const StatusIcon: React.FC<{ status: MessageStatus; color: string; theme: any }> = ({ status, color, theme }) => {
  const iconSize = 14;
  
  switch (status) {
    case 'sending':
      return <Clock size={iconSize} color={color} />;
    case 'sent':
      return <Check size={iconSize} color={color} />;
    case 'delivered':
      return <CheckCheck size={iconSize} color={color} />;
    case 'read':
      return <CheckCheck size={iconSize} color={theme.colors.accent.main} />;
    case 'failed':
      return <AlertCircle size={iconSize} color={theme.colors.secondary.error} />;
    default:
      return null;
  }
};

// ============================================
// COMPONENT
// ============================================

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTime = true,
  onImagePress,
  onViewingRequestPress,
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render based on message type
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <TouchableOpacity
            onPress={() => message.metadata?.imageUrl && onImagePress?.(message.metadata.imageUrl)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.metadata?.thumbnailUrl || message.metadata?.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            {message.content && (
              <Text
                style={[
                  styles.imageCaption,
                  { color: isOwn ? theme.colors.surface : theme.colors.textPrimary },
                ]}
              >
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'viewing_request':
        return (
          <TouchableOpacity
            onPress={() => message.metadata?.viewingRequest && 
              onViewingRequestPress?.(message.metadata.viewingRequest.id)}
            style={[
              styles.viewingRequest,
              {
                backgroundColor: isOwn
                  ? 'rgba(255,255,255,0.15)'
                  : `${theme.colors.accent.main}15`,
                borderColor: isOwn ? 'rgba(255,255,255,0.3)' : theme.colors.accent.main,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.viewingHeader}>
              <Calendar 
                size={18} 
                color={isOwn ? theme.colors.surface : theme.colors.accent.main} 
              />
              <Text
                style={[
                  styles.viewingTitle,
                  { color: isOwn ? theme.colors.surface : theme.colors.accent.main },
                ]}
              >
                Programează vizionare
              </Text>
            </View>
            <Text
              style={[
                styles.viewingDetails,
                { color: isOwn ? 'rgba(255,255,255,0.9)' : theme.colors.textPrimary },
              ]}
            >
              {message.content}
            </Text>
          </TouchableOpacity>
        );

      case 'system':
        return (
          <View style={styles.systemMessage}>
            <Text
              style={[
                styles.systemText,
                { color: theme.colors.textTertiary },
              ]}
            >
              {message.content}
            </Text>
          </View>
        );

      default:
        return (
          <Text
            style={[
              styles.text,
              { color: isOwn ? theme.colors.surface : theme.colors.textPrimary },
            ]}
          >
            {message.content}
          </Text>
        );
    }
  };

  // System messages are centered
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        {renderContent()}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwn
            ? [
                styles.ownBubble,
                { backgroundColor: theme.colors.primary.main },
              ]
            : [
                styles.otherBubble,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ],
        ]}
      >
        {renderContent()}

        {/* Time and status */}
        {showTime && (
          <View style={[styles.footer, isOwn && styles.ownFooter]}>
            <Text
              style={[
                styles.time,
                {
                  color: isOwn
                    ? 'rgba(255,255,255,0.7)'
                    : theme.colors.textTertiary,
                },
              ]}
            >
              {formatTime(message.createdAt)}
            </Text>
            {isOwn && (
              <View style={styles.status}>
                <StatusIcon
                  status={message.status}
                  color="rgba(255,255,255,0.7)"
                  theme={theme}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  image: {
    width: 220,
    height: 160,
    borderRadius: 12,
  },
  imageCaption: {
    marginTop: 6,
    fontSize: 14,
  },
  viewingRequest: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minWidth: 180,
  },
  viewingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  viewingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewingDetails: {
    fontSize: 14,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ownFooter: {
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: 11,
  },
  status: {
    marginLeft: 2,
  },
});

export default MessageBubble;
