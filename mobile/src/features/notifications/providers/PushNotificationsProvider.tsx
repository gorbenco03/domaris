/**
 * RIVA - Push Notifications Provider
 * Registers device push tokens after authentication.
 * Handles navigation when user taps on a notification.
 */

import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, CommonActions } from '@react-navigation/native';
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
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  // Handle notification tap - navigate to appropriate screen
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        const notificationType = data?.type?.toLowerCase?.() || '';

        // Helper to navigate to viewing detail
        const navigateToViewingDetail = (viewingId: string) => {
          // Use global navigation - this will be handled by RootNavigator
          const nav = navigationRef.current;
          if (nav?.dispatch) {
            nav.dispatch(
              CommonActions.navigate({
                name: 'Main',
                params: {
                  screen: 'ProfileTab',
                  params: {
                    screen: 'ViewingDetail',
                    params: { viewingId },
                  },
                },
              })
            );
          }
        };

        // Helper to navigate to property detail
        const navigateToProperty = (propertyId: string) => {
          const nav = navigationRef.current;
          if (nav?.dispatch) {
            nav.dispatch(
              CommonActions.navigate({
                name: 'Main',
                params: {
                  screen: 'SearchTab',
                  params: {
                    screen: 'PropertyDetail',
                    params: { propertyId },
                  },
                },
              })
            );
          }
        };

        // Route based on notification type
        if (
          (notificationType === 'viewing_request' ||
            notificationType === 'viewing_confirmed' ||
            notificationType === 'viewing_cancelled' ||
            notificationType === 'viewing_reminder' ||
            notificationType === 'feedback_request') &&
          data?.viewingId
        ) {
          navigateToViewingDetail(String(data.viewingId));
        } else if (data?.propertyId) {
          navigateToProperty(String(data.propertyId));
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

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
