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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreVertical, ArrowLeft } from 'lucide-react-native';
import {
  useMessages,
  useSendMessage,
  useConversation,
  useMarkAsRead,
  useArchiveConversation,
  useStartConversation,
} from '@/features/messaging/hooks/useMessaging';
import socketService from '@/features/messaging/services/socketService';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { MessagesStackParamList } from '@/app/navigation/types';
import { Message, Participant, PropertyPreview } from '../types';
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

  const flatListRef = useRef<FlatList>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  const conversationId = route.params.conversationId;
  const isNew = conversationId === 'new';

  // Fetch conversation details and messages (skip if new)
  const { data: conversation, isLoading: isConversationLoading } = useConversation(conversationId);
  const { data: messagesData, isLoading: isMessagesLoading } = useMessages(conversationId);
  
  const sendMessageMutation = useSendMessage();
  const startConversationMutation = useStartConversation();
  const markAsReadMutation = useMarkAsRead();
  const archiveConversationMutation = useArchiveConversation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // WebSocket setup
  useEffect(() => {
    if (isNew || !conversationId || !socketService.getIsConnected()) return;

    socketService.joinConversation(Number(conversationId));

    // Listen for new messages
    const handleNewMessage = (incomingMessage: IMessage) => {
      const message = incomingMessage as any;
      if (String(message.conversationId) === String(conversationId)) {
        const mapped: Message = {
          id: String(message.id),
          conversationId: String(message.conversationId),
          senderId: String(message.senderId),
          type: 'text' as const,
          content: message.content,
          status: 'delivered' as any,
          createdAt: new Date(message.createdAt),
        };
        setMessages((prev) => [mapped, ...prev]);
      }
    };

    socketService.onNewMessage(handleNewMessage);

    const handleUserTyping = ({ conversationId: cid, userId }: any) => {
      if (String(cid) === String(conversationId) && String(userId) !== String(user?.id)) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };
    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.leaveConversation(Number(conversationId));
      socketService.off('message:new', handleNewMessage);
      socketService.off('user:typing', handleUserTyping);
    };
  }, [conversationId, isNew, user]);

  // Map messages from API
  useEffect(() => {
    if (messagesData) {
      const mapped: Message[] = messagesData.map((item: IMessage) => {
        const m = item as any;
        return {
          id: String(m.id),
          conversationId: String(m.conversationId),
          senderId: String(m.senderId),
          type: 'text' as const,
          content: m.content,
          status: (m.readAt ? 'read' : 'delivered') as any,
          createdAt: new Date(m.createdAt),
        };
      }).reverse();

      setMessages(mapped);
    }
  }, [messagesData]);

  // Mark as read when entering chat
  useEffect(() => {
    if (conversationId && !isNew) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId, isNew]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user) return;
      
      const tempId = `temp-${Date.now()}`;
      
      try {
        const tempMessage: Message = {
          id: tempId,
          conversationId: conversationId,
          senderId: user.id,
          type: 'text',
          content,
          status: 'sending',
          createdAt: new Date(),
        };

        setMessages((prev) => [tempMessage, ...prev]);

        if (isNew) {
          // Create new conversation
          const propertyId = route.params.propertyId;
          const recipientNameParam = route.params.recipientName;

          if (!propertyId) throw new Error('Property ID missing for new conversation');
          
          // Start conversation via API
          const newConversation = await startConversationMutation.mutateAsync({
            propertyId: Number(propertyId),
            message: content
          });
          
          // The API returns the conversation object.
          // We need to update the navigation params to the real ID so WebSockets connect
          // But navigation.setParams might not be enough to trigger a full re-mount or might be tricky with hooks.
          // Better to replace the screen or reset params.
          
          // For now, let's assume setParams works and triggers re-render
          navigation.setParams({ 
            conversationId: String(newConversation.id),
            // Keep other params if needed, or fetch from newConversation
            recipientName: recipientNameParam 
          });

          // Also remove the temp message because the refetch will bring the real one?
          // Or keep it until refetch happens.
          
        } else {
          // Existing conversation
          if (socketService.getIsConnected()) {
            socketService.sendMessage(Number(conversationId), content, 'TEXT');
          } else {
            await sendMessageMutation.mutateAsync({
              conversationId: conversationId,
              content,
              type: 'TEXT',
            });
          }
        }

        // Remove temp message (real one will come via WebSocket or query invalidation)
        setMessages((prev) => prev.filter((m) => m.id !== tempId));

      } catch (error) {
        console.error('Send message failed', error);
        Alert.alert('Eroare', 'Mesajul nu a putut fi trimis');
        // Remove failed temp message
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [conversationId, sendMessageMutation, startConversationMutation, user, isNew, route.params.propertyId, navigation, route.params.recipientName]
  );

  const handleAttachPress = () => Alert.alert('Atașament', 'În curând');
  const handleCameraPress = () => Alert.alert('Cameră', 'În curând');
  const handleCallPress = () => Alert.alert('Apel', 'În curând');

  const handleMenuPress = () => {
    const participantData = (conversation as any)?.otherParticipant;

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
        text: 'Arhivează',
        onPress: async () => {
          try {
            await archiveConversationMutation.mutateAsync(conversationId);
            Alert.alert('Succes', 'Conversația a fost arhivată');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Eroare', 'Nu am putut arhiva conversația');
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

  const participant: Participant = {
    id: String(otherParticipant?.id || ''),
    name: otherParticipant
      ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
      : route.params.recipientName || 'Unknown',
    isOnline: false,
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
          keyExtractor={(item) => item.id}
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
