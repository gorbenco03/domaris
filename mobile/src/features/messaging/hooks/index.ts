/**
 * RIVA - Messaging Hooks
 * Placeholder hooks for messaging feature - will be connected to backend later
 */

import { useState, useCallback } from 'react';
import { Conversation, Message, ConversationFilter } from '../types';

// ============================================
// useConversations Hook
// ============================================

interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  filter: ConversationFilter;
  setFilter: (filter: ConversationFilter) => void;
  refetch: () => void;
  unreadCount: number;
}

export const useConversations = (): UseConversationsReturn => {
  const [conversations] = useState<Conversation[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [filter, setFilter] = useState<ConversationFilter>('all');

  const refetch = useCallback(() => {
    // Will be implemented with backend integration
  }, []);

  const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return {
    conversations,
    isLoading,
    error,
    filter,
    setFilter,
    refetch,
    unreadCount,
  };
};

// ============================================
// useChat Hook
// ============================================

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => void;
  sendImage: (imageUri: string) => void;
  markAsRead: () => void;
  isTyping: boolean;
  isSending: boolean;
}

export const useChat = (_conversationId: string): UseChatReturn => {
  const [messages] = useState<Message[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [isTyping] = useState(false);
  const [isSending] = useState(false);

  const sendMessage = useCallback((_content: string) => {
    // Will be implemented with backend integration
  }, []);

  const sendImage = useCallback((_imageUri: string) => {
    // Will be implemented with backend integration
  }, []);

  const markAsRead = useCallback(() => {
    // Will be implemented with backend integration
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendImage,
    markAsRead,
    isTyping,
    isSending,
  };
};

// ============================================
// useMessageTemplates Hook
// ============================================

import { MessageTemplate } from '../types';

interface UseMessageTemplatesReturn {
  templates: MessageTemplate[];
  isLoading: boolean;
  createTemplate: (template: Omit<MessageTemplate, 'id' | 'userId'>) => void;
  deleteTemplate: (templateId: string) => void;
}

export const useMessageTemplates = (): UseMessageTemplatesReturn => {
  const [templates] = useState<MessageTemplate[]>([
    {
      id: '1',
      title: 'Salut',
      content: 'Bună ziua! Sunt interesat de proprietatea dumneavoastră.',
      type: 'greeting',
      isSystem: true,
    },
    {
      id: '2',
      title: 'Disponibilitate',
      content: 'Este proprietatea încă disponibilă?',
      type: 'question',
      isSystem: true,
    },
    {
      id: '3',
      title: 'Programare vizionare',
      content: 'Când ar fi posibilă o vizionare a proprietății?',
      type: 'question',
      isSystem: true,
    },
    {
      id: '4',
      title: 'Mulțumesc',
      content: 'Vă mulțumesc pentru informații!',
      type: 'response',
      isSystem: true,
    },
  ]);
  const [isLoading] = useState(false);

  const createTemplate = useCallback((_template: Omit<MessageTemplate, 'id' | 'userId'>) => {
    // Will be implemented with backend integration
  }, []);

  const deleteTemplate = useCallback((_templateId: string) => {
    // Will be implemented with backend integration
  }, []);

  return {
    templates,
    isLoading,
    createTemplate,
    deleteTemplate,
  };
};
