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
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  isOnline?: boolean;
  isVerified?: boolean;
}

/** Build display name from participant (API sends firstName/lastName, not name) */
export function getParticipantName(p?: ConversationParticipant | null): string {
  if (!p) return 'Utilizator';
  if (p.name) return p.name;
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Utilizator';
}

export function getParticipantInitials(p?: ConversationParticipant | null): string {
  const name = getParticipantName(p);
  return name.split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || 'U';
}

export interface ConversationProperty {
  id: string;
  title: string;
  image?: string | null;
  mainImage?: string | null;
  price?: number;
  currency?: string;
}

/** Get property image URL (API may send image or mainImage) */
export function getPropertyImage(p?: ConversationProperty | null): string | null {
  if (!p) return null;
  return p.image || p.mainImage || null;
}

export interface ConversationListItem {
  id: string;
  property?: ConversationProperty | null;
  otherParticipant?: ConversationParticipant | null;
  lastMessage?: {
    content?: string;
    text?: string;
    createdAt?: string;
    sentAt?: string;
    senderId?: number;
    isFromMe?: boolean;
    type?: string;
  } | null;
  unreadCount?: number;
  status?: string;
  updatedAt: string;
  isArchived?: boolean;
}

/** Get last message text from conversation (API may use content or text) */
export function getLastMessageText(msg?: ConversationListItem['lastMessage']): string {
  if (!msg) return '';
  return msg.content || msg.text || '';
}

/** Get last message time from conversation (API may use createdAt or sentAt) */
export function getLastMessageTime(msg?: ConversationListItem['lastMessage']): string | null {
  if (!msg) return null;
  return msg.createdAt || msg.sentAt || null;
}

export interface Conversation {
  id: string;
  property?: ConversationProperty | null;
  participants: ConversationParticipant[];
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: number | string;
  sender?: {
    id: number | string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
  };
  // API may return text or content
  text?: string;
  content?: string;
  type: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST';
  // API may return isRead boolean or readAt date
  isRead?: boolean;
  readAt?: string | null;
  // API may return sentAt or createdAt
  sentAt?: string;
  createdAt?: string;
  isFromMe?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
}

/** Get display text from a message (API uses text or content) */
export function getMessageText(msg?: Message | null): string {
  if (!msg) return '';
  return msg.content || msg.text || '';
}

/** Get message timestamp (API uses sentAt or createdAt) */
export function getMessageTime(msg?: Message | null): string {
  if (!msg) return '';
  return msg.sentAt || msg.createdAt || '';
}

/** Check if message is read */
export function isMessageRead(msg?: Message | null): boolean {
  if (!msg) return false;
  if (typeof msg.isRead === 'boolean') return msg.isRead;
  return !!msg.readAt;
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
