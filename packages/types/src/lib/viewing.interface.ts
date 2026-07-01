/**
 * 📅 VIEWING INTERFACES
 *
 * Aliniate la serializarea backend-ului (viewing.service.ts → formatViewing()).
 * Backend emite: slot + requestedSlots + confirmedSlot + isOwner + owner/seeker.
 */

import type { ViewingStatus } from './enums.js';

// ============================================================================
// VIEWING
// ============================================================================

/**
 * Slot de timp pentru vizionare (forma emisă de backend).
 */
export interface IViewingTimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * Participant la vizionare (owner / seeker), așa cum îl emite backend-ul.
 */
export interface IViewingParticipant {
  id: string;
  name: string;
  avatar?: string;
  /** Prezent doar pentru vizionări confirmate (răspuns detaliat). */
  phone?: string;
}

/**
 * Proprietate sumar atașată unei vizionări (forma emisă de backend).
 */
export interface IViewingProperty {
  id: string;
  title: string;
  address: string;
  imageUrl?: string;
  price: number;
}

/**
 * Vizionare programată — reflectă exact ce emite backend-ul.
 */
export interface IViewing {
  id: string;
  propertyId: string;
  ownerId: string;
  seekerId: string;

  status: ViewingStatus;

  /** Slot principal (păstrat pentru compatibilitate). */
  slot: IViewingTimeSlot;
  /** Sloturile cerute de seeker. */
  requestedSlots: IViewingTimeSlot[];
  /** Prezent când status === 'confirmed'. */
  confirmedSlot?: IViewingTimeSlot;

  duration: number;
  notes?: string;

  /** true când utilizatorul curent este proprietarul. */
  isOwner?: boolean;

  property?: IViewingProperty | null;
  owner?: IViewingParticipant;
  seeker?: IViewingParticipant;

  feedback?: IViewingFeedback;

  // Timestamps
  createdAt: Date | string;
  confirmedAt?: Date | string;
  cancelledAt?: Date | string;
  completedAt?: Date | string;
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
 * Cerere de vizionare nouă (body acceptat de backend).
 */
export interface ICreateViewingDto {
  propertyId: number;
  slot: string; // ISO datetime
  notes?: string;
}

/**
 * Confirmare / schimbare status vizionare.
 */
export interface IConfirmViewingDto {
  status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
}

/**
 * Anulare vizionare
 */
export interface ICancelViewingDto {
  reason: string;
}

/**
 * Reprogramare vizionare (body acceptat de backend).
 */
export interface IRescheduleViewingDto {
  newSlot: string; // ISO datetime
  reason?: string;
}

/**
 * Submit feedback (body acceptat de backend).
 */
export interface ISubmitViewingFeedbackDto {
  rating: number;
  comment?: string;
  interested?: boolean;
}

// ============================================================================
// LIST ITEMS
// ============================================================================

/**
 * @deprecated Backend emite aceeași formă `IViewing` și pentru listă
 * (viewing.service.ts → formatViewing()). Folosește `IViewing`.
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
