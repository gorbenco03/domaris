/**
 * RIVA - Notifications Types
 * Based on docs/mobile/features/09-NOTIFICATIONS.md
 */

export type NotificationType =
  // Mesaje
  | 'message'
  | 'new_message'
  // Vizionări (tipuri reale din backend)
  | 'viewing_request'
  | 'viewing_requested'
  | 'viewing_confirmed'
  | 'viewing_cancelled'
  | 'viewing_reminder'
  | 'viewing_rescheduled'
  | 'feedback_request'
  // Contracte
  | 'contract_proposed'
  | 'contract_accepted'
  | 'contract_signed'
  | 'contract_partially_signed'
  // Proprietăți
  | 'property_match'
  | 'price_change'
  | 'property_unavailable'
  // Recenzii
  | 'new_review'
  | 'review_response'
  // Verificare și sistem
  | 'verification_complete'
  | 'new_device_login'
  | 'promotion';

export type NotificationChannel = 'push' | 'in_app' | 'email' | 'sms';

export type ActionType = 'open_conversation' | 'open_property' | 'open_viewing' | 'open_url';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionType?: ActionType;
  actionPayload?: string;
  actionData?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  channels: NotificationChannel[];
  deliveredVia: NotificationChannel[];
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  push: {
    enabled: boolean;
    messages: boolean;
    viewings: boolean;
    propertyAlerts: boolean;
    priceChanges: boolean;
    marketing: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  email: {
    enabled: boolean;
    digest: 'none' | 'daily' | 'weekly';
    transactional: boolean;
    marketing: boolean;
  };
  sms: {
    enabled: boolean;
    viewingReminders: boolean;
    urgentOnly: boolean;
  };
}

export const NOTIFICATION_TYPE_INFO: Record<NotificationType, { icon: string; color: string; label: string }> = {
  // Mesaje
  message: { icon: 'message-circle', color: '#3b82f6', label: 'Mesaj' },
  new_message: { icon: 'message-circle', color: '#3b82f6', label: 'Mesaj nou' },
  // Vizionări
  viewing_request: { icon: 'calendar', color: '#10b981', label: 'Cerere vizionare' },
  viewing_requested: { icon: 'calendar', color: '#10b981', label: 'Cerere vizionare' },
  viewing_confirmed: { icon: 'check-circle', color: '#10b981', label: 'Vizionare confirmată' },
  viewing_cancelled: { icon: 'x-circle', color: '#ef4444', label: 'Vizionare anulată' },
  viewing_reminder: { icon: 'clock', color: '#f59e0b', label: 'Reminder vizionare' },
  viewing_rescheduled: { icon: 'calendar', color: '#f59e0b', label: 'Vizionare reprogramată' },
  feedback_request: { icon: 'star', color: '#f59e0b', label: 'Feedback vizionare' },
  // Contracte
  contract_proposed: { icon: 'file-text', color: '#6366f1', label: 'Contract propus' },
  contract_accepted: { icon: 'check-circle', color: '#10b981', label: 'Contract acceptat' },
  contract_signed: { icon: 'check-circle', color: '#10b981', label: 'Contract semnat' },
  contract_partially_signed: { icon: 'file-text', color: '#f59e0b', label: 'Contract semnat parțial' },
  // Proprietăți
  property_match: { icon: 'home', color: '#6366f1', label: 'Proprietate potrivită' },
  price_change: { icon: 'trending-down', color: '#10b981', label: 'Schimbare preț' },
  property_unavailable: { icon: 'alert-circle', color: '#94a3b8', label: 'Indisponibil' },
  // Recenzii
  new_review: { icon: 'star', color: '#10b981', label: 'Recenzie nouă' },
  review_response: { icon: 'message-circle', color: '#6366f1', label: 'Răspuns recenzie' },
  // Sistem
  verification_complete: { icon: 'shield-check', color: '#10b981', label: 'Verificare completă' },
  new_device_login: { icon: 'smartphone', color: '#f59e0b', label: 'Login nou' },
  promotion: { icon: 'gift', color: '#8b5cf6', label: 'Promoție' },
};
