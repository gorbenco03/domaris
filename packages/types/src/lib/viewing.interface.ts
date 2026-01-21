/**
 * 📅 VIEWING INTERFACES
 */

import type { ViewingStatus } from './enums.js';
import type { IPublicUserProfile } from './user.interface.js';
import type { IPropertyListItem } from './property.interface.js';

// ============================================================================
// VIEWING
// ============================================================================

/**
 * Vizionare programată
 */
export interface IViewing {
  id: string;
  propertyId: string;
  property?: IPropertyListItem;
  
  // Participanți
  requesterId: string;
  requester?: IPublicUserProfile;
  ownerId: string;
  owner?: IPublicUserProfile;
  
  // Programare
  proposedDates: IViewingTimeSlot[];
  confirmedDate?: Date | string;
  
  // Status
  status: ViewingStatus;
  
  // Note și feedback
  requesterNote?: string;
  ownerNote?: string;
  cancellationReason?: string;
  
  // Feedback post-vizionare
  feedback?: IViewingFeedback;
  
  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  confirmedAt?: Date | string;
  completedAt?: Date | string;
}

/**
 * Slot de timp pentru vizionare
 */
export interface IViewingTimeSlot {
  date: Date | string;
  startTime: string; // HH:MM
  endTime?: string;
  isPreferred?: boolean;
}

/**
 * Feedback după vizionare
 */
export interface IViewingFeedback {
  rating: number; // 1-5
  wouldRecommend: boolean;
  comment?: string;
  submittedAt: Date | string;
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * Cerere de vizionare nouă
 */
export interface ICreateViewingDto {
  propertyId: string;
  proposedDates: IViewingTimeSlot[];
  note?: string;
}

/**
 * Confirmare vizionare
 */
export interface IConfirmViewingDto {
  confirmedDate: Date | string;
  note?: string;
}

/**
 * Anulare vizionare
 */
export interface ICancelViewingDto {
  reason: string;
}

/**
 * Reprogramare vizionare
 */
export interface IRescheduleViewingDto {
  newProposedDates: IViewingTimeSlot[];
  reason?: string;
}

/**
 * Submit feedback
 */
export interface ISubmitViewingFeedbackDto {
  rating: number;
  wouldRecommend: boolean;
  comment?: string;
}

// ============================================================================
// LIST ITEMS
// ============================================================================

/**
 * Vizionare în listă
 */
export interface IViewingListItem {
  id: string;
  
  property: {
    id: string;
    title: string;
    mainImage?: string;
    address: string;
  };
  
  otherParty: {
    id: string;
    firstName: string;
    avatar?: string;
    isVerified: boolean;
  };
  
  role: 'REQUESTER' | 'OWNER';
  status: ViewingStatus;
  
  confirmedDate?: Date | string;
  proposedDatesCount: number;
  
  createdAt: Date | string;
}
