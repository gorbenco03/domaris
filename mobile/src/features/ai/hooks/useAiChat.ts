/**
 * useAiChat - Custom hook for persistent AI chat
 * Manages conversation state, message sending, and persistence
 */

import { useState, useCallback, useRef } from 'react';
import { aiApi, IAiConversationDetail, IAiMessageResponse, IAiSendMessageResponse } from '../api/aiApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  conversationPhase?: string;
  properties?: any[];
  suggestedActions?: Array<{
    type: string;
    label: string;
    payload?: Record<string, any>;
  }>;
}

interface ClientProfile {
  classificationComplete: boolean;
  classificationScore: number;
  conversationPhase?: string;
  transactionType?: string;
  propertyType?: string;
  budget?: { min?: number; max?: number };
  preferences?: {
    cities?: string[];
    neighborhoods?: string[];
    rooms?: number;
    roomsMin?: number;
    roomsMax?: number;
    amenities?: string[];
    isFurnished?: boolean;
    petFriendly?: boolean;
  };
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  conversationId: number | null;
  clientProfile: ClientProfile;
  error: string | null;
  loadConversation: (id?: number) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  startNewConversation: () => Promise<void>;
}

export function useAiChat(): UseAiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile>({
    classificationComplete: false,
    classificationScore: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<number | null>(null);

  const mapMessages = useCallback((apiMessages: IAiMessageResponse[]): ChatMessage[] => {
    return apiMessages.map(msg => ({
      id: String(msg.id),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.createdAt),
      conversationPhase: msg.metadata?.conversationPhase,
      properties: msg.metadata?.propertyCards,
      suggestedActions: msg.metadata?.suggestedActions,
    }));
  }, []);

  const loadConversation = useCallback(async (id?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      let conversation: IAiConversationDetail;

      if (id) {
        conversation = await aiApi.getConversation(id);
      } else {
        conversation = await aiApi.getActiveConversation();
      }

      setConversationId(conversation.id);
      conversationIdRef.current = conversation.id;
      setMessages(mapMessages(conversation.messages));
      setClientProfile(conversation.clientProfile || {
        classificationComplete: false,
        classificationScore: 0,
      });
    } catch (err: any) {
      // If loading fails, create a new conversation
      try {
        const conversation = await aiApi.createConversation();
        setConversationId(conversation.id);
        conversationIdRef.current = conversation.id;
        setMessages(mapMessages(conversation.messages));
        setClientProfile(conversation.clientProfile || {
          classificationComplete: false,
          classificationScore: 0,
        });
      } catch (createErr: any) {
        setError('Nu am putut porni conversatia. Incearca din nou.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [mapMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationIdRef.current || isSending) return;

    setIsSending(true);
    setError(null);

    // Optimistic: add user message immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response: IAiSendMessageResponse = await aiApi.sendConversationMessage(
        conversationIdRef.current,
        text,
      );

      // Replace temp message with real one and add assistant response
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
        return [
          ...withoutTemp,
          {
            id: String(response.userMessage.id),
            role: 'user' as const,
            content: response.userMessage.content,
            timestamp: new Date(response.userMessage.createdAt),
          },
          {
            id: String(response.assistantMessage.id),
            role: 'assistant' as const,
            content: response.assistantMessage.content,
            timestamp: new Date(response.assistantMessage.createdAt),
            conversationPhase:
              response.clientProfile?.conversationPhase
              || response.assistantMessage.metadata?.conversationPhase,
            properties: response.properties || response.assistantMessage.metadata?.propertyCards,
            suggestedActions: response.suggestedActions || response.assistantMessage.metadata?.suggestedActions,
          },
        ];
      });

      // Update client profile
      if (response.clientProfile) {
        setClientProfile(response.clientProfile);
      }
    } catch (err: any) {
      // Remove optimistic message and show error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setError('Nu am putut trimite mesajul. Incearca din nou.');

      // Add error message from assistant
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Imi pare rau, a aparut o eroare. Te rog sa incerci din nou.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  const startNewConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const conversation = await aiApi.createConversation();
      setConversationId(conversation.id);
      conversationIdRef.current = conversation.id;
      setMessages(mapMessages(conversation.messages));
      setClientProfile(conversation.clientProfile || {
        classificationComplete: false,
        classificationScore: 0,
      });
    } catch (err: any) {
      setError('Nu am putut crea conversatia.');
    } finally {
      setIsLoading(false);
    }
  }, [mapMessages]);

  return {
    messages,
    isLoading,
    isSending,
    conversationId,
    clientProfile,
    error,
    loadConversation,
    sendMessage,
    startNewConversation,
  };
}
