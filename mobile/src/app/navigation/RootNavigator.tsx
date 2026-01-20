/**
 * IMOBI - Root Navigator
 * Main navigation structure
 */

import React from 'react';
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

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  // Show loading while auth is initializing
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
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
