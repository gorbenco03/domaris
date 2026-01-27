/**
 * Viewings & Bookings Types
 */

// ============================================
// VIEWING STATUS
// ============================================

export type ViewingStatus =
  | 'pending'      // Așteaptă confirmare
  | 'confirmed'    // Confirmat
  | 'rescheduled'  // Reprogramat, așteaptă confirmare
  | 'cancelled'    // Anulat
  | 'completed'    // Finalizat
  | 'no_show';     // Nu s-a prezentat

// ============================================
// TIME SLOT
// ============================================

export interface TimeSlot {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

// ============================================
// WEEKLY SLOT (For availability settings)
// ============================================

export interface WeeklySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  slots: { startTime: string; endTime: string }[];
}

// ============================================
// OWNER AVAILABILITY
// ============================================

export interface OwnerAvailability {
  propertyId: string;
  ownerId: string;
  
  // Definire disponibilitate
  defaultSlots: WeeklySlot[];
  blockedDates: string[]; // YYYY-MM-DD
  customSlots: TimeSlot[];
  
  // Setări
  advanceBookingDays: number;  // min zile în avans
  bufferMinutes: number;       // între vizionări
  maxViewingsPerDay: number;
}

// ============================================
// VIEWING FEEDBACK
// ============================================

export interface ViewingFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  interested: boolean;
  comment?: string;
  createdAt: Date;
}

// ============================================
// VIEWING
// ============================================

export interface Viewing {
  id: string;
  propertyId: string;
  ownerId: string;
  seekerId: string;
  
  // Property info (denormalized for display)
  property: {
    id: string;
    title: string;
    address: string;
    imageUrl?: string;
    price: number;
  };
  
  // Owner/Seeker info
  owner: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
  };
  seeker: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
  };
  
  // Timing
  requestedSlots: TimeSlot[];   // Propuse de căutător
  confirmedSlot?: TimeSlot;     // Confirmat de proprietar
  duration: number;             // minute (default 30)
  
  // Status
  status: ViewingStatus;
  
  // Detalii
  notes?: string;
  meetingPoint?: string;
  
  // Feedback
  ownerFeedback?: ViewingFeedback;
  seekerFeedback?: ViewingFeedback;
  
  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

// ============================================
// DAYS OF WEEK
// ============================================

export const DAYS_OF_WEEK = [
  { key: 0, short: 'D', full: 'Duminică' },
  { key: 1, short: 'L', full: 'Luni' },
  { key: 2, short: 'Ma', full: 'Marți' },
  { key: 3, short: 'Mi', full: 'Miercuri' },
  { key: 4, short: 'J', full: 'Joi' },
  { key: 5, short: 'V', full: 'Vineri' },
  { key: 6, short: 'S', full: 'Sâmbătă' },
] as const;

// ============================================
// STATUS HELPERS
// ============================================

export const STATUS_INFO: Record<ViewingStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'În așteptare', color: '#f59e0b', icon: 'clock' },
  confirmed: { label: 'Confirmat', color: '#10b981', icon: 'check-circle' },
  rescheduled: { label: 'Reprogramat', color: '#6366f1', icon: 'refresh-cw' },
  cancelled: { label: 'Anulat', color: '#ef4444', icon: 'x-circle' },
  completed: { label: 'Finalizat', color: '#3b82f6', icon: 'check' },
  no_show: { label: 'Absent', color: '#94a3b8', icon: 'alert-circle' },
};
