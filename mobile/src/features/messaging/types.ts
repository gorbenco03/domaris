/**
 * RIVA - Messaging Types
 * Type definitions for the messaging feature
 */

// ============================================
// CONVERSATION TYPES
// ============================================

export interface Participant {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface PropertyPreview {
  id: string;
  title: string;
  price: number;
  currency: 'EUR' | 'RON';
  imageUrl?: string;
  type: 'sale' | 'rent';
}

export interface ConversationParticipant {
  userId: string;
  role: 'OWNER' | 'INQUIRER';
  name?: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  // Populated for UI
  property?: PropertyPreview;
  otherParticipant?: Participant;
}

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType = 'text' | 'image' | 'viewing_request' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ViewingRequest {
  id: string;
  date: Date;
  time: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface MessageMetadata {
  imageUrl?: string;
  thumbnailUrl?: string;
  viewingRequest?: ViewingRequest;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
  status: MessageStatus;
  readAt?: Date;
  createdAt: Date;
}

// ============================================
// MESSAGE TEMPLATE TYPES
// ============================================

export type TemplateType = 'greeting' | 'question' | 'response';

export interface MessageTemplate {
  id: string;
  userId?: string;
  title: string;
  content: string;
  type: TemplateType;
  isSystem?: boolean;
}

// ============================================
// QUICK ACTIONS
// ============================================

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  action: string;
}

// ============================================
// FILTER TYPES
// ============================================

export type ConversationFilter = 'all' | 'unread' | 'archived';
