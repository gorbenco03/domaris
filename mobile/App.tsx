/**
 * IMOBI - Main Application Entry Point
 * Platforma Imobiliară Direct de la Proprietari
 */

import React, { useEffect, useCallback } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Providers
import { QueryProvider } from '@/app/providers/QueryProvider';
import { ThemeProvider, useTheme } from '@/app/providers/ThemeProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';

// Navigation
import RootNavigator from '@/app/navigation/RootNavigator';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// ============================================
// APP CONTENT (with theme access)
// ============================================

const AppContent: React.FC = () => {
  const { isDark, theme } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <RootNavigator />
    </>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom fonts
        await Font.loadAsync({
          'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./src/assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
        });

        // Add any other initialization logic here
        // e.g., load cached data, initialize analytics, etc.

      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
