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
import { MoreVertical } from 'lucide-react-native';

import { useTheme } from '@/app/providers/ThemeProvider';
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

const CURRENT_USER_ID = 'seeker-1';

const MOCK_PARTICIPANT: Participant = {
  id: 'owner-1',
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

const generateMockMessages = (): Message[] => {
  const now = Date.now();
  return [
    {
      id: '1',
      conversationId: '1',
      senderId: 'seeker-1',
      type: 'text' as const,
      content: 'Bună ziua! Mă interesează apartamentul. Este încă disponibil?',
      status: 'read' as const,
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
    },
    {
      id: '2',
      conversationId: '1',
      senderId: 'owner-1',
      type: 'text' as const,
      content: 'Da, este disponibil! Când ați dori să veniți la vizionare?',
      status: 'read' as const,
      createdAt: new Date(now - 2.9 * 60 * 60 * 1000),
    },
    {
      id: '3',
      conversationId: '1',
      senderId: 'seeker-1',
      type: 'text' as const,
      content: 'Poate sâmbătă dimineața?',
      status: 'read' as const,
      createdAt: new Date(now - 2.8 * 60 * 60 * 1000),
    },
    {
      id: '4',
      conversationId: '1',
      senderId: 'owner-1',
      type: 'viewing_request' as const,
      content: 'Sâmbătă, 25 Ian 2026 la ora 10:00',
      metadata: {
        viewingRequest: {
          id: 'vr-1',
          date: new Date(2026, 0, 25, 10, 0),
          time: '10:00',
          status: 'pending' as const,
        },
      },
      status: 'read' as const,
      createdAt: new Date(now - 2.7 * 60 * 60 * 1000),
    },
    {
      id: '5',
      conversationId: '1',
      senderId: 'seeker-1',
      type: 'text' as const,
      content: 'Perfect, vă mulțumesc! Ne vedem sâmbătă.',
      status: 'delivered' as const,
      createdAt: new Date(now - 15 * 60 * 1000),
    },
  ].reverse();
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
  const navigation = useNavigation<ChatNavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const flatListRef = useRef<FlatList>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  const [messages, setMessages] = useState<Message[]>(generateMockMessages());
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Simulate typing indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTyping((prev) => !prev);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: route.params.conversationId,
      senderId: CURRENT_USER_ID,
      type: 'text' as const,
      content,
      status: 'sending' as const,
      createdAt: new Date(),
    };

    setMessages((prev) => [newMessage, ...prev]);

    // Simulate status update
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' as const } : msg
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
        )
      );
    }, 1500);
  }, [route.params.conversationId]);

  const handleAttachPress = () => {
    Alert.alert('Atașament', 'Funcționalitate în curs de implementare');
  };

  const handleCameraPress = () => {
    Alert.alert('Cameră', 'Funcționalitate în curs de implementare');
  };

  const handleCallPress = () => {
    Alert.alert('Apel', 'Funcționalitate în curs de implementare');
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Opțiuni Conversație',
      'Ce acțiune doriți să efectuați?',
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Raportează Utilizator', 
          style: 'destructive',
          onPress: () => navigation.navigate('Report', {
            conversationId: route.params.conversationId,
            userId: MOCK_PARTICIPANT.id,
            userName: MOCK_PARTICIPANT.name,
          }) 
        },
        { text: 'Arhivează Conversația', onPress: () => Alert.alert('Arhivat', 'Conversația a fost mutată în arhivă.') },
      ]
    );
  };

  const handleScheduleViewing = () => {
    Alert.alert('Vizionare', 'Se deschide programatorul de vizionări...');
  };

  const handleAskLocation = () => {
    handleSendMessage('Bună ziua! Ați putea să îmi spuneți adresa exactă a proprietății?');
  };

  const handleAskPrice = () => {
    handleSendMessage('Este negociabil prețul? Care ar fi marja de negociere?');
  };

  const handleUseTemplate = () => {
    setShowQuickActions(false);
    navigation.navigate('Templates');
  };

  const handleAISuggestion = (suggestion: string) => {
    chatInputRef.current?.setMessage(suggestion);
    chatInputRef.current?.focus();
  };

  const handleImagePress = (imageUrl: string) => {
    // Navigate to image viewer
  };

  const handleViewingRequestPress = (requestId: string) => {
    Alert.alert('Vizionare', `Detalii vizionare: ${requestId}`);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === CURRENT_USER_ID;
    const nextMessage = messages[index + 1];
    
    // Check if we need date separator
    const showDateSeparator = !nextMessage || 
      getMessageDateLabel(item.createdAt) !== getMessageDateLabel(nextMessage.createdAt);

    return (
      <>
        <MessageBubble
          message={item}
          isOwn={isOwn}
          onImagePress={handleImagePress}
          onViewingRequestPress={handleViewingRequestPress}
        />
        {showDateSeparator && <DateSeparator date={item.createdAt} />}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <ChatHeader
        participant={MOCK_PARTICIPANT}
        property={MOCK_PROPERTY}
        onBackPress={() => navigation.goBack()}
        onCallPress={handleCallPress}
        onMenuPress={handleMenuPress}
        onPropertyPress={() => setShowQuickActions(true)}
      />

      {/* AI Analysis Floating Widget */}
      <AIChatAnalysis onSuggestResponse={handleAISuggestion} />

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
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

        {/* Typing indicator */}
        <TypingIndicator visible={isTyping} />

        {/* Input */}
        <ChatInput
          ref={chatInputRef}
          onSend={handleSendMessage}
          onAttachPress={handleAttachPress}
          onCameraPress={handleCameraPress}
        />
      </KeyboardAvoidingView>

      {/* Quick Actions Menu */}
      <QuickActionsMenu
        visible={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onScheduleViewing={handleScheduleViewing}
        onAskLocation={handleAskLocation}
        onAskPrice={handleAskPrice}
        onUseTemplate={handleUseTemplate}
        onCall={handleCallPress}
        phoneAvailable={true}
      />
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
});

export default ChatScreen;
