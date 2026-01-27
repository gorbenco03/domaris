/**
 * IMOBI - Notifications Application Services
 */

export { notificationsApi } from '../api/notificationsApi';
export {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useRegisterPushToken,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks/useNotifications';
