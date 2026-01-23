/**
 * IMOBI - Chat Screen
 * Individual conversation chat interface
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreVertical, ArrowLeft } from 'lucide-react-native';
import {
  useMessages,
  useSendMessage,
  useConversation,
  useMarkAsRead,
  useArchiveConversation,
  useStartConversation,
  useUnarchiveConversation,
} from '@/features/messaging/hooks/useMessaging';
import socketService from '@/features/messaging/services/socketService';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { MessagesStackParamList } from '@/app/navigation/types';
import { Message, Participant, PropertyPreview } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import {
  MessageBubble,
  ChatInput,
  ChatHeader,
  QuickActionsMenu,
  TypingIndicator,
} from '../components';
import { ChatInputRef } from '../components/ChatInput';
import { getMessageDateLabel } from '@/shared/utils/dateUtils';
import type { IMessage } from '@domaris/types';

// ============================================
// TYPES
// ============================================

type ChatRouteProp = RouteProp<MessagesStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<MessagesStackParamList, 'Chat'>;

interface DateSeparatorProps {
  date: Date;
}

// ============================================
// DATE SEPARATOR
// ============================================

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.dateSeparator}>
      <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
      <Text style={[styles.dateText, { color: theme.colors.textTertiary }]}>
        {getMessageDateLabel(date)}
      </Text>
      <View style={[styles.dateLine, { backgroundColor: theme.colors.border }]} />
    </View>
  );
};

// ============================================
// COMPONENT
// ============================================

const ChatScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<ChatNavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const queryClient = useQueryClient();

  const flatListRef = useRef<FlatList>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  const initialConversationId = route.params.conversationId;
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
  const isNew = activeConversationId === 'new';

  useEffect(() => {
    setActiveConversationId(route.params.conversationId);
  }, [route.params.conversationId]);

  // Fetch conversation details and messages (skip if new)
  const { data: conversation, isLoading: isConversationLoading } = useConversation(activeConversationId);
  const { data: messagesData, isLoading: isMessagesLoading } = useMessages(activeConversationId);
  
  const sendMessageMutation = useSendMessage();
  const startConversationMutation = useStartConversation();
  const markAsReadMutation = useMarkAsRead();
  const archiveConversationMutation = useArchiveConversation();
  const unarchiveConversationMutation = useUnarchiveConversation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isParticipantOnline, setIsParticipantOnline] = useState(false);

  const mapMessageType = (rawType: string | undefined) => {
    const normalized = (rawType || 'TEXT').toUpperCase();
    switch (normalized) {
      case 'IMAGE':
        return 'image' as const;
      case 'VIEWING_REQUEST':
        return 'viewing_request' as const;
      case 'SYSTEM':
        return 'system' as const;
      default:
        return 'text' as const;
    }
  };

  // WebSocket setup
  useEffect(() => {
    if (isNew || !activeConversationId) return;

    // Join conversation if connected
    if (socketService.getIsConnected()) {
      socketService.joinConversation(Number(activeConversationId));
    }

    // Re-join on reconnect
    const handleReconnect = () => {
      socketService.joinConversation(Number(activeConversationId));
    };
    const unsubscribeConnect = socketService.onConnect(handleReconnect);

    // Listen for new messages
    const handleNewMessage = (incomingMessage: IMessage) => {
      const message = incomingMessage as any;
      if (String(message.conversationId) === String(activeConversationId)) {
        const content = message.content ?? message.text ?? '';
        const isFromCurrentUser = String(message.senderId ?? message.sender?.id ?? '') === String(user?.id);
        const mapped: Message = {
          id: String(message.id),
          conversationId: String(message.conversationId),
          senderId: String(message.senderId ?? message.sender?.id ?? ''),
          type: mapMessageType(message.type),
          content,
          status: 'delivered',
          createdAt: new Date(message.createdAt ?? message.sentAt ?? new Date()),
        };
        setMessages((prev) => mergeMessagesById([mapped], prev));
        
        // If message is from another user and we're viewing the chat, mark as read immediately
        if (!isFromCurrentUser && socketService.getIsConnected()) {
          socketService.sendRead(Number(activeConversationId));
        }
        
        // Update conversations list cache - don't increment unread since we're viewing
        queryClient.setQueriesData({ queryKey: [QUERY_KEYS.CONVERSATIONS] }, (oldData: any) => {
          if (!oldData) return oldData;
          const list = Array.isArray(oldData) ? oldData : oldData.data || [];
          const updated = list.map((conv: any) => {
            if (String(conv.id) !== String(activeConversationId)) return conv;
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                content: content,
                text: content,
                createdAt: mapped.createdAt,
                sentAt: mapped.createdAt,
                isFromMe: isFromCurrentUser,
              },
              updatedAt: mapped.createdAt,
              // Don't increment unreadCount since user is viewing this chat
              unreadCount: 0,
            };
          });
          return Array.isArray(oldData) ? updated : { ...oldData, data: updated };
        });
      }
    };

    socketService.onNewMessage(handleNewMessage);

    const handleUserTyping = ({ conversationId: cid, userId }: any) => {
      if (String(cid) === String(activeConversationId) && String(userId) !== String(user?.id)) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };
    socketService.onUserTyping(handleUserTyping);

    return () => {
      unsubscribeConnect();
      if (socketService.getIsConnected()) {
        socketService.leaveConversation(Number(activeConversationId));
      }
      socketService.off('message:new', handleNewMessage);
      socketService.off('user:typing', handleUserTyping);
    };
  }, [activeConversationId, isNew, user, queryClient]);

  useEffect(() => {
    if (!socketService.getIsConnected()) return;

    const handleMessageSent = (data: { localId?: string; message: IMessage }) => {
      const message = data.message as any;
      if (String(message.conversationId) !== String(activeConversationId)) return;
      const content = message.content ?? message.text ?? '';
      const mapped: Message = {
        id: String(message.id),
        conversationId: String(message.conversationId),
        senderId: String(message.senderId ?? message.sender?.id ?? ''),
        type: mapMessageType(message.type),
        content,
        status: message.readAt ? 'read' : 'delivered',
        createdAt: new Date(message.createdAt ?? message.sentAt ?? new Date()),
      };

      setMessages((prev) => {
        const withoutTemp = data.localId ? prev.filter((m) => m.id !== data.localId) : prev;
        return mergeMessagesById([mapped], withoutTemp);
      });
      queryClient.setQueriesData({ queryKey: [QUERY_KEYS.CONVERSATIONS] }, (oldData: any) => {
        if (!oldData) return oldData;
        const list = Array.isArray(oldData) ? oldData : oldData.data || [];
        const updated = list.map((conv: any) => {
          if (String(conv.id) !== String(activeConversationId)) return conv;
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              content: content,
              text: content,
              createdAt: mapped.createdAt,
              sentAt: mapped.createdAt,
              isFromMe: true,
            },
            updatedAt: mapped.createdAt,
          };
        });
        return Array.isArray(oldData) ? updated : { ...oldData, data: updated };
      });
    };

    socketService.onMessageSent(handleMessageSent);

    return () => {
      socketService.off('message:sent', handleMessageSent);
    };
  }, [activeConversationId, queryClient]);

  // Map messages from API
  useEffect(() => {
    if (messagesData) {
      const mapped: Message[] = messagesData.map((item: IMessage) => {
        const m = item as any;
        const content = m.content ?? m.text ?? '';
        const senderId = String(m.senderId ?? m.sender?.id ?? '');
        return {
          id: String(m.id),
          conversationId: String(m.conversationId),
          senderId,
          type: mapMessageType(m.type),
          content,
          status: m.readAt ? 'read' : 'delivered',
          createdAt: new Date(m.createdAt ?? m.sentAt ?? new Date()),
        };
      }).reverse();

      setMessages((prev) => mergeMessagesById(mapped, prev));
    }
  }, [messagesData]);

  // Mark as read when entering/focusing chat
  useFocusEffect(
    useCallback(() => {
      if (!activeConversationId || isNew) return;

      // Mark as read via API
      markAsReadMutation.mutate(activeConversationId);
      
      // Also via socket for real-time receipt
      if (socketService.getIsConnected()) {
        socketService.sendRead(Number(activeConversationId));
      }

      // Update unread count in conversations cache to 0 for this conversation
      queryClient.setQueriesData({ queryKey: [QUERY_KEYS.CONVERSATIONS] }, (oldData: any) => {
        if (!oldData) return oldData;
        const list = Array.isArray(oldData) ? oldData : oldData.data || [];
        const updated = list.map((conv: any) => {
          if (String(conv.id) !== String(activeConversationId)) return conv;
          return { ...conv, unreadCount: 0 };
        });
        return Array.isArray(oldData) ? updated : { ...oldData, data: updated };
      });
    }, [activeConversationId, isNew])
  );

  // Read receipt updates
  useEffect(() => {
    if (!socketService.getIsConnected()) return;

    const handleReadReceipt = (data: { conversationId: number; readBy: number }) => {
      if (String(data.conversationId) !== String(activeConversationId)) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === String(user?.id) ? { ...msg, status: 'read' } : msg
        )
      );
    };

    socketService.onMessageRead(handleReadReceipt);

    return () => {
      socketService.off('message:read_receipt', handleReadReceipt);
    };
  }, [activeConversationId, user]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user) return;
      
      const tempId = `temp-${Date.now()}`;
      
      try {
        const tempMessage: Message = {
          id: tempId,
          conversationId: activeConversationId,
          senderId: user.id,
          type: 'text',
          content,
          status: 'sending',
          createdAt: new Date(),
        };

        setMessages((prev) => mergeMessagesById([tempMessage], prev));

        if (isNew) {
          // Create new conversation
          const propertyId = route.params.propertyId;
          const recipientNameParam = route.params.recipientName;

          if (!propertyId) throw new Error('Property ID missing for new conversation');
          
          // Start conversation via API (without sending message)
          const newConversation = await startConversationMutation.mutateAsync({
            propertyId: Number(propertyId),
          });

          const newId = String(newConversation.id);
          setActiveConversationId(newId);
          navigation.setParams({
            conversationId: newId,
            recipientName: recipientNameParam,
          });

          if (socketService.getIsConnected()) {
            socketService.joinConversation(Number(newId));
            socketService.sendMessage(Number(newId), content, 'TEXT', tempId);
          } else {
            const sent = await sendMessageMutation.mutateAsync({
              conversationId: newId,
              content,
              type: 'TEXT',
            });
            const mapped: Message = {
              id: String((sent as any).id),
              conversationId: newId,
              senderId: user.id,
              type: mapMessageType((sent as any).type),
              content: (sent as any).content ?? (sent as any).text ?? content,
              status: (sent as any).readAt ? 'read' : 'delivered',
              createdAt: new Date((sent as any).createdAt ?? new Date()),
            };
            setMessages((prev) => mergeMessagesById([mapped], prev.filter((m) => m.id !== tempId)));
            return;
          }
        } else {
          // Existing conversation
          if (socketService.getIsConnected()) {
            socketService.sendMessage(Number(activeConversationId), content, 'TEXT', tempId);
          } else {
            const sent = await sendMessageMutation.mutateAsync({
              conversationId: activeConversationId,
              content,
              type: 'TEXT',
            });
            const mapped: Message = {
              id: String((sent as any).id),
              conversationId: activeConversationId,
              senderId: user.id,
              type: mapMessageType((sent as any).type),
              content: (sent as any).content ?? (sent as any).text ?? content,
              status: (sent as any).readAt ? 'read' : 'delivered',
              createdAt: new Date((sent as any).createdAt ?? new Date()),
            };
            setMessages((prev) => mergeMessagesById([mapped], prev.filter((m) => m.id !== tempId)));
            return;
          }
        }

        // Remove temp message (real one will come via WebSocket or query invalidation)
        if (!socketService.getIsConnected()) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }

      } catch (error) {
        console.error('Send message failed', error);
        Alert.alert('Eroare', 'Mesajul nu a putut fi trimis');
        // Remove failed temp message
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [
      activeConversationId,
      sendMessageMutation,
      startConversationMutation,
      user,
      isNew,
      route.params.propertyId,
      navigation,
      route.params.recipientName,
      queryClient,
    ]
  );

  // Note: We no longer invalidate conversations on unfocus as it causes pull-to-refresh issues.
  // The socket updates and mark-as-read logic handle cache updates appropriately.

  const mergeMessagesById = (incoming: Message[], existing: Message[]) => {
    const map = new Map<string, Message>();
    existing.forEach((msg) => map.set(msg.id, msg));
    incoming.forEach((msg) => map.set(msg.id, msg));
    return Array.from(map.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  };

  const getMessageKey = (message: Message, index: number) => {
    if (message.id) return message.id;
    const createdAt = message.createdAt instanceof Date ? message.createdAt.toISOString() : String(message.createdAt);
    return `${message.senderId}-${createdAt}-${index}`;
  };

  const handleAttachPress = () => Alert.alert('Atașament', 'În curând');
  const handleCameraPress = () => Alert.alert('Cameră', 'În curând');
  const handleCallPress = () => Alert.alert('Apel', 'În curând');

  const handleMenuPress = () => {
    const participantData = (conversation as any)?.otherParticipant;
    const isArchived =
      (conversation as any)?.status === 'ARCHIVED' || (conversation as any)?.status === 'archived';

    Alert.alert('Opțiuni', 'Ce acțiune doriți?', [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Raportează',
        style: 'destructive',
        onPress: () =>
          navigation.navigate('Report', {
            conversationId: route.params.conversationId,
            userId: String(participantData?.id || ''),
            userName: participantData
              ? `${participantData.firstName} ${participantData.lastName}`
              : 'Unknown',
          }),
      },
      {
        text: isArchived ? 'Dezarhivează' : 'Arhivează',
        onPress: async () => {
          try {
            if (isArchived) {
              await unarchiveConversationMutation.mutateAsync(conversationId);
              Alert.alert('Succes', 'Conversația a fost dezarhivată');
            } else {
              await archiveConversationMutation.mutateAsync(conversationId);
              Alert.alert('Succes', 'Conversația a fost arhivată');
            }
            navigation.goBack();
          } catch (error) {
            Alert.alert('Eroare', 'Nu am putut actualiza conversația');
          }
        },
      },
    ]);
  };



  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === String(user?.id);
    const nextMessage = messages[index + 1];
    const showDateSeparator = !nextMessage || 
      getMessageDateLabel(item.createdAt) !== getMessageDateLabel(nextMessage.createdAt);

    return (
      <>
        <MessageBubble
          message={item}
          isOwn={isOwn}
          onImagePress={() => {}}
          onViewingRequestPress={() => {}}
        />
        {showDateSeparator && <DateSeparator date={item.createdAt} />}
      </>
    );
  };

  // Get participant and property from conversation (or params if new)
  const otherParticipant = (conversation as any)?.otherParticipant;
  const property = (conversation as any)?.property;

  useEffect(() => {
    setIsParticipantOnline(Boolean(otherParticipant?.isOnline));
  }, [otherParticipant?.isOnline]);

  useEffect(() => {
    if (!otherParticipant?.id) return;

    const handleOnline = (data: { userId: number }) => {
      if (String(otherParticipant?.id) === String(data.userId)) {
        setIsParticipantOnline(true);
      }
    };
    const handleOffline = (data: { userId: number }) => {
      if (String(otherParticipant?.id) === String(data.userId)) {
        setIsParticipantOnline(false);
      }
    };

    // Attach listeners - they work even if socket connects later
    socketService.onUserOnline(handleOnline);
    socketService.onUserOffline(handleOffline);

    return () => {
      socketService.off('user_online', handleOnline);
      socketService.off('user_offline', handleOffline);
    };
  }, [otherParticipant?.id]);

  const participant: Participant = {
    id: String(otherParticipant?.id || ''),
    name: otherParticipant
      ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
      : route.params.recipientName || 'Unknown',
    isOnline: isParticipantOnline,
  };

  // Property preview
  // If we have conversation data, use it. If new, we don't have full property details yet unless passed via params.
  // Ideally, if it's new, we might want to fetch property details separately, or just hide the header preview until created.
  const propertyPreview: PropertyPreview | undefined = property
    ? {
        id: property.id,
        title: property.title,
        price: property.price,
        currency: 'EUR',
        type: property.transactionType === 'SALE' ? 'sale' : 'rent',
      }
    : undefined;

  // Loading state (only if NOT new and loading)
  if (!isNew && (isConversationLoading || isMessagesLoading)) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Se încarcă conversația...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ChatHeader
        participant={participant}
        property={propertyPreview}
        onBackPress={() => navigation.goBack()}
        onCallPress={handleCallPress}
        onMenuPress={handleMenuPress}
        onPropertyPress={() => propertyPreview && setShowQuickActions(true)}
      />



      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={getMessageKey}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        <TypingIndicator visible={isTyping} />

        <ChatInput
          ref={chatInputRef}
          onSend={handleSendMessage}
          onAttachPress={handleAttachPress}
          onCameraPress={handleCameraPress}
        />
      </KeyboardAvoidingView>

      {propertyPreview && (
        <QuickActionsMenu
          visible={showQuickActions}
          onClose={() => setShowQuickActions(false)}
          onScheduleViewing={() => {}}
          onAskLocation={() => handleSendMessage('Unde se află?')}
          onAskPrice={() => handleSendMessage('Este negociabil?')}
          onUseTemplate={() => {
            setShowQuickActions(false);
            navigation.navigate('Templates');
          }}
          onCall={handleCallPress}
          phoneAvailable={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  messagesList: { paddingVertical: 8 },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateLine: { flex: 1, height: 1 },
  dateText: { fontSize: 12, fontWeight: '500', paddingHorizontal: 12 },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default ChatScreen;
