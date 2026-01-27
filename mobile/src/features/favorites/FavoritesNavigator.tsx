/**
 * IMOBI - Favorites Navigator
 * Stack navigator for favorites and comparison features
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FavoritesStackParamList } from '@/app/navigation/types';
import FavoritesListScreen from './screens/FavoritesListScreen';
import PropertyCompareScreen from './screens/PropertyCompareScreen';
import { PropertyDetailScreen, PropertyInsightsScreen } from '@/app/navigation/screens';

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

const FavoritesNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Favorites"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Favorites" component={FavoritesListScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="PropertyInsights" component={PropertyInsightsScreen} />
      <Stack.Screen 
        name="Compare" 
        component={PropertyCompareScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default FavoritesNavigator;
