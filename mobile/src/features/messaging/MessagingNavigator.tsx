/**
 * RIVA - Messaging Navigator
 * Stack navigator for messaging feature
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MessagesStackParamList } from '@/app/navigation/types';
import { ConversationsListScreen, ChatScreen, TemplatesScreen, ReportScreen } from './screens';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

const MessagingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ConversationsList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
      />
      <Stack.Screen
        name="Templates"
        component={TemplatesScreen}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
      />
    </Stack.Navigator>
  );
};

export default MessagingNavigator;
