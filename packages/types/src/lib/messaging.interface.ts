/**
 * 💬 MESSAGING INTERFACES
 */

import type {
  MessageType,
  ConversationStatus,
} from './enums.js';
import type { IPublicUserProfile } from './user.interface.js';
import type { IPropertyListItem } from './property.interface.js';

// ============================================================================
// CONVERSATION
// ============================================================================

/**
 * Conversație între utilizatori
 */
export interface IConversation {
  id: string;
  propertyId: string;
  property?: IPropertyListItem;
  
  participants: IConversationParticipant[];
  
  lastMessage?: IMessage;
  lastMessageAt?: Date | string;
  
  unreadCount: number;
  status: ConversationStatus;
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Participant în conversație
 */
export interface IConversationParticipant {
  userId: string;
  user?: IPublicUserProfile;
  role: 'OWNER' | 'INQUIRER';
  joinedAt: Date | string;
  lastReadAt?: Date | string;
  isTyping?: boolean;
}

/**
 * Conversație în listă
 */
export interface IConversationListItem {
  id: string;

  // Cealaltă persoană din conversație (canonical: singular `otherParticipant`)
  otherParticipant: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    isVerified: boolean;
    isOnline?: boolean;
  };

  // Proprietatea discutată (backend emits id, title, price, image)
  property: {
    id: string;
    title: string;
    /** Backend emits `image` (URL of first listing image). */
    image?: string | null;
    /** @deprecated Backend emits `image`, not `mainImage`. */
    mainImage?: string | null;
    price: number;
    currency?: string;
  };

  // Ultimul mesaj — canonical fields are `content` + `createdAt`.
  lastMessage?: {
    /** Canonical content field. */
    content: string;
    /** @deprecated Backend also emits `text` (duplicate of `content`). */
    text?: string;
    type: MessageType;
    /** Canonical timestamp. */
    createdAt: Date | string;
    /** @deprecated Backend also emits `sentAt` (duplicate of `createdAt`). */
    sentAt?: Date | string;
    isFromMe: boolean;
  } | null;

  unreadCount: number;
  status: ConversationStatus;
  updatedAt: Date | string;
}

// ============================================================================
// MESSAGE
// ============================================================================

/**
 * Mesaj în conversație
 */
export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: IPublicUserProfile;

  type: MessageType;

  // Canonical content field (backend emits `content`).
  content: string;
  /** @deprecated Backend also emits `text` as a duplicate of `content`. Use `content`. */
  text?: string;

  // Pentru media messages
  mediaUrl?: string;
  mediaThumbnail?: string;

  // Pentru viewing request messages
  viewingRequest?: {
    id: string;
    proposedDate: Date | string;
    status: string;
  };

  // Status — canonical timestamp is `createdAt` (backend emits `createdAt`).
  createdAt: Date | string;
  /** @deprecated Backend also emits `sentAt` as a duplicate of `createdAt`. Use `createdAt`. */
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string | null;

  /** Computed by backend: true when the current user is the sender. */
  isFromMe?: boolean;

  isEdited?: boolean;
  editedAt?: Date | string;

  isDeleted?: boolean;
}

/**
 * Trimitere mesaj
 */
export interface ISendMessageDto {
  conversationId: string;
  /** Backend expects `content` in the request body. */
  content: string;
  type?: MessageType;
  mediaUrl?: string;
}

/**
 * Creare conversație nouă
 */
export interface ICreateConversationDto {
  propertyId: string;
  recipientId: string;
  initialMessage: string;
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Template mesaj rapid
 */
export interface IMessageTemplate {
  id: string;
  userId: string;
  title: string;
  text: string;
  category: 'INQUIRY' | 'RESPONSE' | 'VIEWING' | 'GENERAL';
  isDefault: boolean;
  usageCount: number;
  createdAt: Date | string;
}

/**
 * Creare template
 */
export interface ICreateMessageTemplateDto {
  title: string;
  text: string;
  category: 'INQUIRY' | 'RESPONSE' | 'VIEWING' | 'GENERAL';
}
