/**
 * RIVA - Messaging API
 * Chat/messaging API client functions (REST + WebSocket)
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

// Import types from shared package
export type {
  IConversation,
  IConversationListItem,
  IConversationParticipant,
  IMessage,
  ISendMessageDto,
  ICreateConversationDto,
} from '@domaris/types';

// ============================================================================
// REST ENDPOINTS (Authenticated)
// ============================================================================

import type { IConversationListItem, IConversation, IMessage } from '@domaris/types';

/**
 * Get all conversations for current user (returns list items)
 */
export const getConversations = async (params?: {
  type?: 'all' | 'unread' | 'archived';
  page?: number;
  limit?: number;
}): Promise<IConversationListItem[]> => {
  const response = await apiClient.get<any>(
    API_ENDPOINTS.CONVERSATIONS.LIST,
    { params }
  );
  return response.data.data;
};

/**
 * Get conversation by ID (detailed)
 */
export const getConversation = async (id: string): Promise<IConversation> => {
  const response = await apiClient.get<IConversation>(
    API_ENDPOINTS.CONVERSATIONS.DETAIL(id)
  );
  return response.data;
};

/**
 * Get messages in conversation
 */
export const getMessages = async (
  conversationId: string,
  before?: string,
  limit: number = 50
): Promise<IMessage[]> => {
  const response = await apiClient.get<any>(
    API_ENDPOINTS.CONVERSATIONS.MESSAGES(conversationId),
    {
      params: { before, limit },
    }
  );
  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.messages)) {
    return payload.messages;
  }
  return [];
};

/**
 * Start or get existing conversation
 */
export const startConversation = async (data: {
  propertyId: number;
  message?: string;
}): Promise<IConversation> => {
  const response = await apiClient.post<IConversation>(
    API_ENDPOINTS.CONVERSATIONS.CREATE,
    data
  );
  return response.data;
};

/**
 * Send message in conversation
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  type: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST' = 'TEXT'
): Promise<IMessage> => {
  const response = await apiClient.post<IMessage>(
    API_ENDPOINTS.CONVERSATIONS.SEND_MESSAGE(conversationId),
    { content, type }
  );
  return response.data;
};

/**
 * Mark conversation as read
 */
export const markMessagesAsRead = async (
  conversationId: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    API_ENDPOINTS.CONVERSATIONS.MARK_READ(conversationId)
  );
  return response.data;
};

/**
 * Archive conversation
 */
export const archiveConversation = async (
  conversationId: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    API_ENDPOINTS.CONVERSATIONS.ARCHIVE(conversationId)
  );
  return response.data;
};

/**
 * Unarchive conversation
 */
export const unarchiveConversation = async (
  conversationId: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    API_ENDPOINTS.CONVERSATIONS.UNARCHIVE(conversationId)
  );
  return response.data;
};

/**
 * Get unread messages count
 */
export const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await apiClient.get<{ count: number }>(
    API_ENDPOINTS.CONVERSATIONS.UNREAD_COUNT
  );
  return response.data;
};

// ============================================================================
// WEBSOCKET FUNCTIONS
// ============================================================================

/**
 * WebSocket events for real-time messaging
 * Use socket.io-client library
 *
 * Example usage:
 *
 * import io from 'socket.io-client';
 *
 * const socket = io('http://localhost:3000', {
 *   auth: { token: accessToken }
 * });
 *
 * // Listen for new messages
 * socket.on('message:new', (message: IMessage) => {
 *   console.log('New message:', message);
 * });
 *
 * // Send message via WebSocket (faster than REST)
 * socket.emit('message:send', {
 *   conversationId: 123,
 *   content: 'Hello!'
 * });
 *
 * // Join conversation room
 * socket.emit('conversation:join', { conversationId: 123 });
 *
 * // Leave conversation room
 * socket.emit('conversation:leave', { conversationId: 123 });
 */

export const WEBSOCKET_EVENTS = {
  // Incoming (listen)
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  USER_TYPING: 'user:typing',

  // Outgoing (emit)
  MESSAGE_SEND: 'message:send',
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
} as const;

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get unread messages count
 */
export const getUnreadMessagesCount = async (): Promise<number> => {
  const conversations = await getConversations();
  return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
};

/**
 * Get conversations with property context
 */
export const getConversationsByProperty = async (
  propertyId: string
): Promise<IConversationListItem[]> => {
  const conversations = await getConversations();
  return conversations.filter((conv) => conv.property.id === propertyId);
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const messagingApi = {
  // REST
  getConversations,
  getConversation,
  getMessages,
  startConversation,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,
  unarchiveConversation,
  getUnreadCount,

  // Convenience
  getUnreadMessagesCount,
  getConversationsByProperty,

  // WebSocket Constants
  WEBSOCKET_EVENTS,
};

export default messagingApi;
