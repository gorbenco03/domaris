/**
 * RIVA - Discovery Navigator
 * Stack navigator for the main discovery/home feed
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from './types';
import {
  HomeScreen,
  SearchResultsScreen,
  FiltersScreen,
  MapSearchScreen,
  PropertyDetailScreen
} from '@/features/search/screens';
import { AIChatScreen, AiConversationsListScreen, PropertyInsightsScreen } from '@/features/ai';

const Stack = createNativeStackNavigator<SearchStackParamList>();

const DiscoveryNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Search" component={HomeScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen 
        name="SearchFilters" 
        component={FiltersScreen} 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom' 
        }} 
      />
      <Stack.Screen name="MapSearch" component={MapSearchScreen} />
      <Stack.Screen name="AIChat" component={AIChatScreen} />
      <Stack.Screen name="AiConversationsList" component={AiConversationsListScreen} />
      <Stack.Screen name="PropertyInsights" component={PropertyInsightsScreen} />
    </Stack.Navigator>
  );
};

export default DiscoveryNavigator;
