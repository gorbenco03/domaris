/**
 * RIVA - Push Notifications Provider
 * Registers device push tokens after authentication.
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/app/providers/AuthProvider';
import { notificationsApi } from '@/features/notifications/services';

const DEVICE_ID_KEY = 'device_id';
const PUSH_TOKEN_KEY = 'push_token';

interface PushNotificationsProviderProps {
  children: React.ReactNode;
}

export const PushNotificationsProvider: React.FC<PushNotificationsProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const registerPushToken = async () => {
      try {
        const projectId =
          (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
          (Constants as any)?.easConfig?.projectId;
        const isValidProjectId =
          typeof projectId === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            projectId
          );

        if (!isValidProjectId) {
          console.warn('Push token registration skipped: invalid projectId');
          return;
        }

        const permissions = await Notifications.getPermissionsAsync();
        if (permissions.status !== 'granted') {
          const request = await Notifications.requestPermissionsAsync();
          if (request.status !== 'granted') {
            return;
          }
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResponse.data;
        if (!token) return;

        const existingToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
        if (existingToken === token) return;

        let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = `${Platform.OS}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;
          await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
        }

        await notificationsApi.registerPushToken({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          deviceId,
        });

        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
      } catch (error) {
        console.warn('Push token registration failed', error);
      }
    };

    registerPushToken();
  }, [isAuthenticated]);

  return <>{children}</>;
};

export default PushNotificationsProvider;
