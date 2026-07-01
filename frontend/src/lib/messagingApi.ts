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
  // Backend emits firstName/lastName (no flat `name`).
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  isOnline?: boolean;
  isVerified?: boolean;
}

/** Build display name from participant (backend emits firstName/lastName). */
export function getParticipantName(p?: ConversationParticipant | null): string {
  if (!p) return 'Utilizator';
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Utilizator';
}

export function getParticipantInitials(p?: ConversationParticipant | null): string {
  const name = getParticipantName(p);
  return name.split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || 'U';
}

export interface ConversationProperty {
  id: string | number;
  title: string;
  // Backend emits `image` (URL of first listing image).
  image?: string | null;
  /** @deprecated Backend emits `image`, not `mainImage`. */
  mainImage?: string | null;
  price?: number;
  currency?: string;
}

/** Get property image URL (backend emits `image`). */
export function getPropertyImage(p?: ConversationProperty | null): string | null {
  if (!p) return null;
  return p.image || null;
}

export interface ConversationListItem {
  id: string;
  property?: ConversationProperty | null;
  otherParticipant?: ConversationParticipant | null;
  lastMessage?: {
    // Canonical fields emitted by backend.
    content?: string;
    createdAt?: string;
    senderId?: number;
    isFromMe?: boolean;
    type?: string;
    /** @deprecated Backend also emits `text` (duplicate of `content`). */
    text?: string;
    /** @deprecated Backend also emits `sentAt` (duplicate of `createdAt`). */
    sentAt?: string;
  } | null;
  unreadCount?: number;
  status?: string;
  updatedAt: string;
  isArchived?: boolean;
}

/** Last message text (backend emits `content`). */
export function getLastMessageText(msg?: ConversationListItem['lastMessage']): string {
  return msg?.content || '';
}

/** Last message time (backend emits `createdAt`). */
export function getLastMessageTime(msg?: ConversationListItem['lastMessage']): string | null {
  return msg?.createdAt || null;
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
  // Canonical content field emitted by backend.
  content?: string;
  /** @deprecated Backend also emits `text` (duplicate of `content`). */
  text?: string;
  type: 'TEXT' | 'IMAGE' | 'VIEWING_REQUEST';
  // Backend emits `readAt` (timestamp or null), not an `isRead` boolean.
  readAt?: string | null;
  // Canonical timestamp emitted by backend.
  createdAt?: string;
  /** @deprecated Backend also emits `sentAt` (duplicate of `createdAt`). */
  sentAt?: string;
  isFromMe?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
}

/** Display text from a message (backend emits `content`). */
export function getMessageText(msg?: Message | null): string {
  return msg?.content || '';
}

/** Message timestamp (backend emits `createdAt`). */
export function getMessageTime(msg?: Message | null): string {
  return msg?.createdAt || '';
}

/** Whether a message has been read (backend emits `readAt`). */
export function isMessageRead(msg?: Message | null): boolean {
  return !!msg?.readAt;
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
 * Start or get existing conversation.
 * Provide propertyId when contacting about a specific listing.
 * Provide participantId when opening a direct conversation with a user (no property context).
 */
export async function startConversation(data: {
  propertyId?: number;
  participantId?: number;
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
