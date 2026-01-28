/**
 * IMOBI - Messaging Hooks
 * React Query hooks for messaging
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { messagingApi } from '../api/messagingApi';
import socketService from '../services/socketService';

/**
 * Get all conversations
 */
export const useConversations = (params?: {
  type?: 'all' | 'unread' | 'archived';
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, params],
    queryFn: () => messagingApi.getConversations(params),
    refetchInterval: () =>
      socketService.getIsConnected() ? false : 30000, // Poll only if sockets are down
  });
};

/**
 * Get conversation details
 */
export const useConversation = (id: string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, id],
    queryFn: () => messagingApi.getConversation(id!),
    enabled: !!id && id !== 'new',
  });
};

/**
 * Get messages for a conversation
 */
export const useMessages = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, conversationId],
    queryFn: () => messagingApi.getMessages(conversationId!),
    enabled: !!conversationId && conversationId !== 'new',
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    // Poll messages less frequently now that sockets are active.
    // 3000ms was too aggressive and caused UI flickering (pull-down effect).
    refetchInterval: (query) =>
      socketService.getIsConnected() ? false : query.state.error ? false : 10000,
  });
};

/**
 * Get unread count
 */
export const useUnreadCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, 'unread-count'],
    queryFn: messagingApi.getUnreadCount,
    refetchInterval: 60000, // Poll every 60s
    enabled,
  });
};

/**
 * Start conversation mutation
 */
export const useStartConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: number; message?: string }) =>
      messagingApi.startConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] });
    },
  });
};

/**
 * Send message mutation
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      conversationId: string;
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST';
    }) =>
      messagingApi.sendMessage(
        data.conversationId,
        data.content,
        data.type || 'TEXT'
      ),
    onSuccess: (_, variables) => {
      // Invalidate messages list
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MESSAGES, variables.conversationId],
      });
      // Invalidate conversations list (last message preview)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] });
    },
  });
};

/**
 * Mark as read mutation
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagingApi.markMessagesAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, 'unread-count'],
      });
    },
  });
};

/**
 * Archive conversation mutation
 */
export const useArchiveConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagingApi.archiveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] });
    },
  });
};

/**
 * Unarchive conversation mutation
 */
export const useUnarchiveConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagingApi.unarchiveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] });
    },
  });
};

/**
/**
 * Socket updates hook - Instant updates without polling
 */
export const useSocketUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleNewMessageNotification = (data: {
      conversationId: number;
      message: any;
      preview: string;
    }) => {
      // 1. Update Conversations List Cache
      queryClient.setQueriesData({ queryKey: [QUERY_KEYS.CONVERSATIONS] }, (oldData: any) => {
        if (!oldData) return oldData;
        
        // Handle paginated response structure or flat array
        const list = Array.isArray(oldData) ? oldData : (oldData.data || []);
        
        const conversationIndex = list.findIndex(
          (c: any) => String(c.id) === String(data.conversationId)
        );

        if (conversationIndex === -1) {
          // New conversation not in list - Invalidate to fetch
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] });
          return oldData;
        }

        const updatedConversation = {
          ...list[conversationIndex],
          lastMessage: {
            content: data.preview,
            createdAt: new Date(), // Now
            isFromMe: false, // Notification implies received
          },
          unreadCount: (list[conversationIndex].unreadCount || 0) + 1,
          updatedAt: new Date(),
        };

        // Move to top
        const newList = [
          updatedConversation,
          ...list.slice(0, conversationIndex),
          ...list.slice(conversationIndex + 1),
        ];

        return Array.isArray(oldData) ? newList : { ...oldData, data: newList };
      });

      // 2. Update Unread Count Cache (Global Badge)
      queryClient.setQueryData(
        [QUERY_KEYS.CONVERSATIONS, 'unread-count'],
        (old: { count: number } | undefined) => ({
          count: (old?.count || 0) + 1,
        })
      );

      // 3. Update Individual Conversation Messages (if cached)
      // Force refresh of the message list for this conversation
      // so when user enters screen, they see the new message immediately
      queryClient.invalidateQueries({ 
        queryKey: [QUERY_KEYS.MESSAGES, String(data.conversationId)] 
      });
    };

    const handleUserOnline = (data: { userId: number }) => {
      queryClient.setQueriesData({ queryKey: [QUERY_KEYS.CONVERSATIONS] }, (oldData: any) => {
        if (!oldData) return oldData;
        const list = Array.isArray(oldData) ? oldData : (oldData.data || []);
        const updatedList = list.map((conv: any) => {
          if (String(conv.otherParticipant?.id) === String(data.userId)) {
            return {
              ...conv,
              otherParticipant: {
                ...conv.otherParticipant,
                isOnline: true,
              },
            };
          }
          return conv;
        });
        return Array.isArray(oldData) ? updatedList : { ...oldData, data: updatedList };
      });
    };

    const handleUserOffline = (data: { userId: number }) => {
      queryClient.setQueriesData({ queryKey: [QUERY_KEYS.CONVERSATIONS] }, (oldData: any) => {
        if (!oldData) return oldData;
        const list = Array.isArray(oldData) ? oldData : (oldData.data || []);
        const updatedList = list.map((conv: any) => {
          if (String(conv.otherParticipant?.id) === String(data.userId)) {
            return {
              ...conv,
              otherParticipant: {
                ...conv.otherParticipant,
                isOnline: false,
              },
            };
          }
          return conv;
        });
        return Array.isArray(oldData) ? updatedList : { ...oldData, data: updatedList };
      });
    };

    // Attach listeners directly - socket.io handles reconnection and listeners persist
    socketService.onNewMessageNotification(handleNewMessageNotification);
    socketService.onUserOnline(handleUserOnline);
    socketService.onUserOffline(handleUserOffline);

    return () => {
      socketService.off('new_message_notification', handleNewMessageNotification);
      socketService.off('user_online', handleUserOnline);
      socketService.off('user_offline', handleUserOffline);
    };
  }, [queryClient]);
};

export const useMessaging = () => {
  // Expose socket service for connection management
  return {
    connect: (token: string) => socketService.connect(token),
    disconnect: () => socketService.disconnect(),
  };
};
