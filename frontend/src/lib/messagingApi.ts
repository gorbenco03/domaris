/**
 * RIVA - Messaging API
 * Chat/messaging API client functions for Frontend
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationParticipant {
  id: number;
  name: string;
  avatar?: string | null;
  isOnline?: boolean;
}

export interface ConversationProperty {
  id: string;
  title: string;
  image?: string | null;
  price?: number;
}

export interface ConversationListItem {
  id: string;
  property: ConversationProperty;
  otherParticipant: ConversationParticipant;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: number;
  } | null;
  unreadCount: number;
  updatedAt: string;
  isArchived?: boolean;
}

export interface Conversation {
  id: string;
  property: ConversationProperty;
  participants: ConversationParticipant[];
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  senderName?: string;
  senderAvatar?: string | null;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST';
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageDto {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST';
}

// ============================================================================
// REST ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all conversations for current user
 */
export async function getConversations(params?: {
  type?: 'all' | 'unread' | 'archived';
  page?: number;
  limit?: number;
}): Promise<ConversationListItem[]> {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  
  const query = queryParams.toString();
  const response = await api.fetch<any>(`/conversations${query ? `?${query}` : ''}`);
  
  // Handle different response formats
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

/**
 * Get conversation by ID (detailed)
 */
export async function getConversation(id: string): Promise<Conversation> {
  return api.fetch<Conversation>(`/conversations/${id}`);
}

/**
 * Get messages in conversation
 */
export async function getMessages(
  conversationId: string,
  before?: string,
  limit: number = 50
): Promise<Message[]> {
  const queryParams = new URLSearchParams();
  if (before) queryParams.append('before', before);
  queryParams.append('limit', String(limit));
  
  const query = queryParams.toString();
  const response = await api.fetch<any>(`/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  
  // Handle different response formats
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (response?.messages && Array.isArray(response.messages)) return response.messages;
  return [];
}

/**
 * Start or get existing conversation about a property
 */
export async function startConversation(data: {
  propertyId: number;
  message?: string;
}): Promise<Conversation> {
  return api.fetch<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Send message in conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  type: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST' = 'TEXT'
): Promise<Message> {
  return api.fetch<Message>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, type }),
  });
}

/**
 * Mark conversation as read
 */
export async function markAsRead(
  conversationId: string
): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/conversations/${conversationId}/read`, {
    method: 'POST',
  });
}

/**
 * Archive conversation
 */
export async function archiveConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/conversations/${conversationId}/archive`, {
    method: 'POST',
  });
}

/**
 * Unarchive conversation
 */
export async function unarchiveConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/conversations/${conversationId}/unarchive`, {
    method: 'POST',
  });
}

/**
 * Get unread messages count
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  return api.fetch<{ count: number }>('/conversations/unread-count');
}

// ============================================================================
// WEBSOCKET EVENTS (for reference)
// ============================================================================

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
// EXPORT ALL
// ============================================================================

export const messagingApi = {
  getConversations,
  getConversation,
  getMessages,
  startConversation,
  sendMessage,
  markAsRead,
  archiveConversation,
  unarchiveConversation,
  getUnreadCount,
  WEBSOCKET_EVENTS,
};

export default messagingApi;
