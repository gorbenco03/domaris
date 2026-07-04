/**
 * RIVA - Push Notifications Provider
 * Registers device push tokens after authentication.
 * Handles navigation when user taps on a notification.
 *
 * NOTE: Uses the navigationRef exported from RootNavigator so navigation works
 * regardless of where this provider sits in the tree (it is outside
 * NavigationContainer in App.tsx, which is why a local ref would stay null).
 *
 * APNs / FCM setup required before production build:
 *  - iOS: set `aps-environment=production` entitlement (handled by EAS on production profile)
 *  - Android: place google-services.json at project root and set
 *    `android.googleServicesFile` in app.json (already done — file must be provided).
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '@/app/providers/AuthProvider';
import { notificationsApi } from '@/features/notifications/services';
import { navigationRef } from '@/app/navigation/RootNavigator';

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
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  // Handle notification tap — navigate to appropriate screen
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        // Normalizează tipul la lowercase pentru comparații robuste
        const notificationType = (data?.type ?? '').toLowerCase();

        const nav = navigationRef.current;
        if (!nav?.dispatch) return;

        // 1. Mesaj nou → Chat
        if (notificationType === 'new_message') {
          const conversationId = data?.conversationId || data?.conversation_id;
          if (conversationId) {
            nav.dispatch(
              CommonActions.navigate({
                name: 'Main',
                params: {
                  screen: 'MessagesTab',
                  params: {
                    screen: 'Chat',
                    params: { conversationId: String(conversationId) },
                  },
                },
              })
            );
            return;
          }
        }

        // 2. Vizionare (orice tip care începe cu viewing_ sau feedback_request)
        const isViewingType =
          notificationType.startsWith('viewing_') ||
          notificationType === 'viewing_requested' ||
          notificationType === 'feedback_request';

        if (isViewingType) {
          const viewingId = data?.viewingId || data?.viewing_id;
          if (viewingId) {
            nav.dispatch(
              CommonActions.navigate({
                name: 'Main',
                params: {
                  screen: 'ProfileTab',
                  params: {
                    screen: 'ViewingDetail',
                    params: { viewingId: String(viewingId) },
                  },
                },
              })
            );
            return;
          }
        }

        // 3. Contract → detaliu vizionare asociată (dacă există) sau lista vizionărilor
        if (notificationType.startsWith('contract_')) {
          const viewingId = data?.viewingId || data?.viewing_id;
          if (viewingId) {
            nav.dispatch(
              CommonActions.navigate({
                name: 'Main',
                params: {
                  screen: 'ProfileTab',
                  params: {
                    screen: 'ViewingDetail',
                    params: { viewingId: String(viewingId) },
                  },
                },
              })
            );
          } else {
            nav.dispatch(
              CommonActions.navigate({
                name: 'Main',
                params: {
                  screen: 'ProfileTab',
                  params: { screen: 'Viewings' },
                },
              })
            );
          }
          return;
        }

        // 4. Proprietate / match / schimbare preț → PropertyDetail
        const propertyId = data?.propertyId || data?.property_id || data?.listingId;
        if (propertyId) {
          nav.dispatch(
            CommonActions.navigate({
              name: 'Main',
              params: {
                screen: 'SearchTab',
                params: {
                  screen: 'PropertyDetail',
                  params: { propertyId: String(propertyId) },
                },
              },
            })
          );
          return;
        }

        // Fără destinație identificată — deschide centrul de notificări
        nav.dispatch(CommonActions.navigate({ name: 'Notifications' }));
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
