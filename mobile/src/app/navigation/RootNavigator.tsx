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
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { NotificationsCenterScreen } from '@/features/notifications';

// Tutorial
import { TutorialOverlay, TutorialPromptModal, useTutorial } from '@/features/tutorial';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const { theme, isDark } = useTheme();
  const { shouldShowPrompt, startTutorial, dismissPrompt } = useTutorial();

  // Enable global socket updates
  useSocketUpdates();

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
  if (!isInitialized || isLoading) {
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
