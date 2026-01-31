/**
 * RIVA - Shared Messaging Service
 * Explicit contract for messaging interactions used across features.
 */

import { messagingApi } from '@/features/messaging/api/messagingApi';

export { useUnreadCount } from '@/features/messaging/hooks/useMessaging';

export const startConversation = (data: { propertyId: number; message?: string }) =>
  messagingApi.startConversation(data);
