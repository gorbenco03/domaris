/**
 * IMOBI - Root Navigator
 * Main navigation structure
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { RootStackParamList } from './types';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Loading Screen Component (simple placeholder)
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { tokenManager } from '@/core/auth/tokenManager';
import socketService from '@/features/messaging/services/socketService';
import { notificationsApi } from '@/features/notifications/api/notificationsApi';

import { NotificationsCenterScreen } from '@/features/notifications';

// Tutorial
import { TutorialOverlay, TutorialPromptModal, useTutorial } from '@/features/tutorial';

const Stack = createNativeStackNavigator<RootStackParamList>();
const DEVICE_ID_KEY = 'device_id';
const PUSH_TOKEN_KEY = 'push_token';

// ============================================
// LOADING SCREEN
// ============================================

const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary.main} />
    </View>
  );
};

// ============================================
// ROOT NAVIGATOR
// ============================================

import { useSocketUpdates } from '@/features/messaging/hooks/useMessaging';

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  const { theme, isDark } = useTheme();
  const { shouldShowPrompt, startTutorial, dismissPrompt } = useTutorial();

  // Enable global socket updates
  useSocketUpdates();

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
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    const connectSocket = async () => {
      const accessToken = await tokenManager.getAccessToken();
      if (accessToken) {
        socketService.connect(accessToken);
      }
    };

    connectSocket();

    return () => {
      socketService.disconnect();
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
          deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

  // Track if user just logged in
  const wasAuthenticated = useRef(isAuthenticated);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);

  // Detect transition from unauthenticated to authenticated
  useEffect(() => {
    if (!wasAuthenticated.current && isAuthenticated && shouldShowPrompt) {
      // Small delay to let navigation settle
      const timer = setTimeout(() => {
        setShowTutorialPrompt(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, shouldShowPrompt]);

  // Handle tutorial prompt responses
  const handleAcceptTutorial = () => {
    setShowTutorialPrompt(false);
    // Small delay to let modal close
    setTimeout(() => {
      startTutorial();
    }, 300);
  };

  const handleDeclineTutorial = () => {
    setShowTutorialPrompt(false);
    dismissPrompt();
  };

  // Show loading while auth is initializing
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <>
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.colors.primary.main,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.accent.main,
        },
        fonts: {
          regular: {
            fontFamily: 'Inter-Regular',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'Inter-Medium',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'Inter-Bold',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'Inter-Bold',
            fontWeight: '800',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsCenterScreen} 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>

    {/* Tutorial Prompt Modal */}
    <TutorialPromptModal
      visible={showTutorialPrompt}
      onAccept={handleAcceptTutorial}
      onDecline={handleDeclineTutorial}
    />

    {/* Tutorial Overlay */}
    <TutorialOverlay />
    </>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
