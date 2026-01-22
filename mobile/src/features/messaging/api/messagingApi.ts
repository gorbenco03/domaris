/**
 * IMOBI - Messaging API
 * Chat/messaging API client functions (REST + WebSocket)
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

// ============================================================================
// TYPES
// ============================================================================

export interface IMessage {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface IConversation {
  id: number;
  propertyId?: number;
  participants: number[]; // User IDs
  lastMessage?: IMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISendMessageRequest {
  conversationId?: number; // Optional: for creating new conversation
  receiverId: number;
  propertyId?: number; // For context
  content: string;
}

// ============================================================================
// REST ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all conversations for current user
 */
export const getConversations = async (): Promise<IConversation[]> => {
  const response = await apiClient.get<IConversation[]>(
    API_ENDPOINTS.MESSAGES.CONVERSATIONS
  );
  return response.data;
};

/**
 * Get conversation by ID
 */
export const getConversation = async (id: number): Promise<IConversation> => {
  const response = await apiClient.get<IConversation>(
    API_ENDPOINTS.MESSAGES.CONVERSATION(String(id))
  );
  return response.data;
};

/**
 * Get messages in conversation
 */
export const getMessages = async (
  conversationId: number,
  page: number = 1,
  limit: number = 50
): Promise<IMessage[]> => {
  const response = await apiClient.get<IMessage[]>(
    API_ENDPOINTS.MESSAGES.MESSAGES(String(conversationId)),
    {
      params: { page, limit },
    }
  );
  return response.data;
};

/**
 * Send message (REST)
 */
export const sendMessage = async (
  data: ISendMessageRequest
): Promise<IMessage> => {
  const response = await apiClient.post<IMessage>(
    API_ENDPOINTS.MESSAGES.SEND,
    data
  );
  return response.data;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  conversationId: number
): Promise<{ success: boolean }> => {
  const response = await apiClient.patch<{ success: boolean }>(
    API_ENDPOINTS.MESSAGES.READ(String(conversationId))
  );
  return response.data;
};

/**
 * Archive conversation
 */
export const archiveConversation = async (
  conversationId: number
): Promise<{ success: boolean }> => {
  const response = await apiClient.patch<{ success: boolean }>(
    API_ENDPOINTS.MESSAGES.ARCHIVE(String(conversationId))
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
  propertyId: number
): Promise<IConversation[]> => {
  const conversations = await getConversations();
  return conversations.filter((conv) => conv.propertyId === propertyId);
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const messagingApi = {
  // REST
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,

  // Convenience
  getUnreadMessagesCount,
  getConversationsByProperty,

  // WebSocket Constants
  WEBSOCKET_EVENTS,
};

export default messagingApi;
