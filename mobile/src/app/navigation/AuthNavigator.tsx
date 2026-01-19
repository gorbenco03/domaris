/**
 * IMOBI - Auth Navigator
 * Authentication flow navigation
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

// Import actual screen components
import {
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
  OTPVerificationScreen,
  UserTypeSelectionScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '@/features/auth/screens';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// ============================================
// AUTH NAVIGATOR
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
      <Stack.Screen 
        name="UserTypeSelection" 
        component={UserTypeSelectionScreen} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
