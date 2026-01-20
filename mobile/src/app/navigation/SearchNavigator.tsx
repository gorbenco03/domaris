/**
 * IMOBI - Search Navigator
 * Stack navigator for property search and discovery
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from './types';
import { 
  HomeScreen, 
  SearchResultsScreen, 
  FiltersScreen, 
  MapSearchScreen,
  PropertyDetailScreen,
  SavedSearchesScreen
} from '@/features/search/screens';

const Stack = createNativeStackNavigator<SearchStackParamList>();

const SearchNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MapSearch" component={MapSearchScreen} />
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
      <Stack.Screen name="SavedSearches" component={SavedSearchesScreen} />
    </Stack.Navigator>
  );
};

export default SearchNavigator;
