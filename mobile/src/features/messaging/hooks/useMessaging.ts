/**
 * IMOBI - Messaging Hooks
 * React Query hooks for messaging
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { messagingApi, ISendMessageRequest } from '../api/messagingApi';

/**
 * Get all conversations
 */
export const useConversations = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS],
    queryFn: messagingApi.getConversations,
    refetchInterval: 10000, // Poll every 10s if no socket
  });
};

/**
 * Get conversation details
 */
export const useConversation = (id: number | string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, id],
    queryFn: () => messagingApi.getConversation(Number(id)),
    enabled: !!id,
  });
};

/**
 * Get messages for a conversation
 */
export const useMessages = (conversationId: number | string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, conversationId],
    queryFn: () => messagingApi.getMessages(Number(conversationId)),
    enabled: !!conversationId,
    refetchInterval: 3000, // Poll messages frequently if sockets not active
  });
};

/**
 * Send message mutation
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ISendMessageRequest) => messagingApi.sendMessage(data),
    onSuccess: (_, variables) => {
      // Invalidate messages list
      if (variables.conversationId) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.MESSAGES, variables.conversationId],
        });
      }
      // Invalidate conversations list (last message preview)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] });
    },
  });
};
