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
  
  // Cealaltă persoană din conversație
  otherParticipant: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isVerified: boolean;
    isOnline?: boolean;
  };
  
  // Proprietatea discutată
  property: {
    id: string;
    title: string;
    mainImage?: string;
    price: number;
    currency: string;
  };
  
  // Ultimul mesaj
  lastMessage?: {
    text: string;
    type: MessageType;
    sentAt: Date | string;
    isFromMe: boolean;
  };
  
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
  text: string;
  
  // Pentru media messages
  mediaUrl?: string;
  mediaThumbnail?: string;
  
  // Pentru viewing request messages
  viewingRequest?: {
    id: string;
    proposedDate: Date | string;
    status: string;
  };
  
  // Status
  sentAt: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
  
  isEdited: boolean;
  editedAt?: Date | string;
  
  isDeleted: boolean;
}

/**
 * Trimitere mesaj
 */
export interface ISendMessageDto {
  conversationId: string;
  text: string;
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
