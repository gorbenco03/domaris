/**
 * IMOBI - Viewing Mapper
 * Transforms backend viewing data to mobile UI format
 */

import { Viewing, ViewingStatus, TimeSlot } from '../types';

/**
 * Backend viewing response format (from API)
 */
export interface BackendViewing {
  id: string;
  propertyId: string;
  ownerId: string;
  seekerId: string;
  status: string;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  requestedSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  confirmedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  duration: number;
  notes?: string;
  createdAt: string | Date;
  confirmedAt?: string | Date;
  cancelledAt?: string | Date;
  completedAt?: string | Date;
  property?: {
    id: string;
    title: string;
    address: string;
    imageUrl?: string;
    price: number;
  };
  owner?: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
  };
  seeker?: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
  };
  seekerFeedback?: {
    rating: number;
    interested: boolean;
    comment?: string;
    createdAt: string | Date;
  };
}

/**
 * Map backend status to mobile status
 */
function mapStatus(backendStatus: string): ViewingStatus {
  const lowerStatus = backendStatus.toLowerCase();
  
  switch (lowerStatus) {
    case 'pending':
      return 'pending';
    case 'accepted':
    case 'confirmed':
      return 'confirmed';
    case 'rejected':
      return 'cancelled'; // Map rejected to cancelled for UI
    case 'cancelled':
      return 'cancelled';
    case 'rescheduled':
      return 'rescheduled';
    case 'completed':
      return 'completed';
    case 'no_show':
      return 'no_show';
    default:
      return 'pending';
  }
}

/**
 * Map backend TimeSlot format to mobile TimeSlot
 */
function mapTimeSlot(slot: {
  date: string;
  startTime: string;
  endTime: string;
}): TimeSlot {
  return {
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
  };
}

/**
 * Transform backend viewing to mobile Viewing format
 */
export function mapViewingFromBackend(backendViewing: BackendViewing): Viewing {
  const viewing: Viewing = {
    id: String(backendViewing.id),
    propertyId: String(backendViewing.propertyId),
    ownerId: String(backendViewing.ownerId),
    seekerId: String(backendViewing.seekerId),
    property: backendViewing.property
      ? {
          id: String(backendViewing.property.id),
          title: backendViewing.property.title || 'Proprietate',
          address: backendViewing.property.address || '',
          imageUrl: backendViewing.property.imageUrl,
          price: backendViewing.property.price || 0,
        }
      : {
          id: String(backendViewing.propertyId),
          title: 'Proprietate',
          address: '',
          price: 0,
        },
    owner: backendViewing.owner
      ? {
          id: String(backendViewing.owner.id),
          name: backendViewing.owner.name || 'Proprietar',
          phone: backendViewing.owner.phone,
          avatar: backendViewing.owner.avatar,
        }
      : {
          id: String(backendViewing.ownerId),
          name: 'Proprietar',
        },
    seeker: backendViewing.seeker
      ? {
          id: String(backendViewing.seeker.id),
          name: backendViewing.seeker.name || 'Utilizator',
          phone: backendViewing.seeker.phone,
          avatar: backendViewing.seeker.avatar,
        }
      : {
          id: String(backendViewing.seekerId),
          name: 'Utilizator',
        },
    requestedSlots: backendViewing.requestedSlots?.map(mapTimeSlot) || [
      mapTimeSlot(backendViewing.slot),
    ],
    confirmedSlot: backendViewing.confirmedSlot
      ? mapTimeSlot(backendViewing.confirmedSlot)
      : undefined,
    duration: backendViewing.duration || 30,
    status: mapStatus(backendViewing.status),
    isOwner: backendViewing.isOwner,
    notes: backendViewing.notes,
    createdAt: new Date(backendViewing.createdAt),
    confirmedAt: backendViewing.confirmedAt
      ? new Date(backendViewing.confirmedAt)
      : undefined,
    cancelledAt: backendViewing.cancelledAt
      ? new Date(backendViewing.cancelledAt)
      : undefined,
    completedAt: backendViewing.completedAt
      ? new Date(backendViewing.completedAt)
      : undefined,
  };

  // Add feedback if exists
  if (backendViewing.seekerFeedback) {
    viewing.seekerFeedback = {
      rating: backendViewing.seekerFeedback.rating as 1 | 2 | 3 | 4 | 5,
      interested: backendViewing.seekerFeedback.interested,
      comment: backendViewing.seekerFeedback.comment,
      createdAt: new Date(backendViewing.seekerFeedback.createdAt),
    };
  }

  return viewing;
}

/**
 * Transform array of backend viewings to mobile format
 */
export function mapViewingsFromBackend(
  backendViewings: BackendViewing[]
): Viewing[] {
  return backendViewings.map(mapViewingFromBackend);
}
