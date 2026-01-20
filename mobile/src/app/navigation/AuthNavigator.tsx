/**
 * IMOBI - Auth Navigator
 * Authentication flow navigation
 * Based on Unified Account Model - no role selection needed
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

// Import screen components (UserTypeSelectionScreen removed per ADR-001)
import {
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
  OTPVerificationScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '@/features/auth/screens';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// ============================================
// AUTH NAVIGATOR
// Simplified flow: Welcome → Register → OTP → Home
// No role selection - users can do everything after verification
// ============================================

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
      />
      <Stack.Screen 
        name="OTPVerification" 
        component={OTPVerificationScreen} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

