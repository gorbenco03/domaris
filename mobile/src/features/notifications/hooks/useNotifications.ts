/**
 * RIVA - Notifications Hooks
 * React Query hooks for notifications
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { notificationsApi, type IRegisterPushTokenRequest } from '../api/notificationsApi';

/**
 * Get all notifications
 */
export const useNotifications = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS],
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 30000, // Refetch every 30s
  });
};

/**
 * Get unread count
 */
export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000, // Refetch every 30s
  });
};

/**
 * Mark notification as read mutation
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    },
  });
};

/**
 * Mark all notifications as read mutation
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
    },
  });
};

/**
 * Register push token mutation
 */
export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: (data: IRegisterPushTokenRequest) =>
      notificationsApi.registerPushToken(data),
  });
};

/**
 * Get notification preferences
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, 'preferences'],
    queryFn: notificationsApi.getNotificationPreferences,
  });
};

/**
 * Update notification preferences mutation
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: any) =>
      notificationsApi.updateNotificationPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATIONS, 'preferences'],
      });
    },
  });
};
