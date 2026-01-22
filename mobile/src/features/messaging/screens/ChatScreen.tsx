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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreVertical, ArrowLeft } from 'lucide-react-native';
import { useMessages, useSendMessage } from '@/features/messaging/hooks/useMessaging';

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
  AIChatAnalysis,
} from '../components';
import { ChatInputRef } from '../components/ChatInput';
import { getMessageDateLabel } from '@/shared/utils/dateUtils';

// ============================================
// MOCK DATA
// ============================================

const MOCK_PARTICIPANT: Participant = {
  id: 'u1',
  name: 'Ion Popescu',
  isOnline: true,
};

const MOCK_PROPERTY: PropertyPreview = {
  id: 'prop-1',
  title: 'Apartament 3 camere Drumul Taberei',
  price: 95000,
  currency: 'EUR',
  type: 'sale',
};

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
  const { data: messagesData, isLoading } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    if (messagesData) {
      const mapped: Message[] = messagesData.map((m: any) => ({
        id: String(m.id),
        conversationId: String(m.conversationId),
        senderId: String(m.senderId),
        type: 'text' as const,
        content: m.content,
        status: (m.isRead ? 'read' : 'delivered') as any,
        createdAt: new Date(m.createdAt),
      })).reverse();
      
      setMessages(mapped);
    }
  }, [messagesData]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user) return;
    try {
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        conversationId: conversationId,
        senderId: user.id,
        type: 'text',
        content,
        status: 'sending',
        createdAt: new Date(),
      };
      
      setMessages(prev => [tempMessage, ...prev]);

      await sendMessageMutation.mutateAsync({
        conversationId: Number(conversationId),
        receiverId: 0, // In an existing conversation, backend knows the receiver
        content
      });
    } catch (error) {
      console.error('Send message failed', error);
      Alert.alert('Eroare', 'Mesajul nu a putut fi trimis');
    }
  }, [conversationId, sendMessageMutation, user]);

  const handleAttachPress = () => Alert.alert('Atașament', 'În curând');
  const handleCameraPress = () => Alert.alert('Cameră', 'În curând');
  const handleCallPress = () => Alert.alert('Apel', 'În curând');

  const handleMenuPress = () => {
    Alert.alert('Opțiuni', 'Ce acțiune doriți?', [
      { text: 'Anulează', style: 'cancel' },
      { 
        text: 'Raportează', 
        style: 'destructive',
        onPress: () => navigation.navigate('Report', {
          conversationId: route.params.conversationId,
          userId: MOCK_PARTICIPANT.id,
          userName: MOCK_PARTICIPANT.name,
        }) 
      },
      { text: 'Arhivează', onPress: () => Alert.alert('Ok', 'Arhivat.') },
    ]);
  };

  const handleAISuggestion = (suggestion: string) => {
    chatInputRef.current?.setMessage(suggestion);
    chatInputRef.current?.focus();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ChatHeader
        participant={MOCK_PARTICIPANT}
        property={MOCK_PROPERTY}
        onBackPress={() => navigation.goBack()}
        onCallPress={handleCallPress}
        onMenuPress={handleMenuPress}
        onPropertyPress={() => setShowQuickActions(true)}
      />

      <AIChatAnalysis onSuggestResponse={handleAISuggestion} />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  messagesList: { paddingVertical: 8 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  dateLine: { flex: 1, height: 1 },
  dateText: { fontSize: 12, fontWeight: '500', paddingHorizontal: 12 },
});

export default ChatScreen;
