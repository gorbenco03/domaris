/**
 * RIVA - Main Navigator
 * Main app navigation with bottom tabs
 */

import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, MessageCircle, Heart, User } from 'lucide-react-native';

import { MainTabParamList } from './types';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import ProfileNavigator from './ProfileNavigator';
import DiscoveryNavigator from './DiscoveryNavigator';
import SearchNavigator from './SearchNavigator';
import { FavoritesNavigator } from '@/features/favorites';
import { MessagingNavigator } from '@/features/messaging';
import { useUnreadCount } from '@/features/messaging/hooks/useMessaging';
import { useTutorialTarget } from '@/features/tutorial';
import { AuthRequiredScreen } from '@/shared/components';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================
// TAB BAR ICON COMPONENT
// ============================================

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
  IconComponent: React.FC<{ size: number; color: string; strokeWidth?: number }>;
  tutorialKey?: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, color, size, IconComponent, tutorialKey }) => {
  const ref = useRef<View>(null);

  // Register as tutorial target if key provided
  if (tutorialKey) {
    useTutorialTarget(tutorialKey, ref);
  }

  return (
    <View ref={ref}>
      <IconComponent
        size={size}
        color={color}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
};

// ============================================
// MAIN NAVIGATOR
// ============================================

const MainNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Get unread count for badge
  const { data: unreadData } = useUnreadCount(isAuthenticated);
  const unreadCount = unreadData?.count || 0;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: theme.componentSizes.bottomNav.height + insets.bottom,
          paddingTop: theme.spacing[2],
          paddingBottom: insets.bottom,
          ...theme.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontFamily: 'Inter-Medium',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={DiscoveryNavigator}
        options={{
          tabBarLabel: 'Acasă',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              size={size} 
              IconComponent={Home} 
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (event) => {
            const state = route.state;
            
            // If already on Home screen, do nothing
            if (state && state.index === 0 && state.routes[0].name === 'Home') {
              return;
            }
            
            // Otherwise, reset to Home screen
            event.preventDefault();
            navigation.navigate('HomeTab', {
              screen: 'Home',
            });
          },
        })}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchNavigator}
        options={{
          tabBarLabel: 'Caută',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              size={size} 
              IconComponent={Search} 
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (event) => {
            const state = route.state;
            
            // If already on SearchResults screen, do nothing
            if (state && state.index === 0) {
              return;
            }
            
            // Otherwise, reset to initial screen
            event.preventDefault();
            navigation.navigate('SearchTab', {
              screen: 'SearchResults',
            });
          },
        })}
      />
      <Tab.Screen
        name="MessagesTab"
        options={{
          tabBarLabel: 'Mesaje',
          tabBarBadge: isAuthenticated && unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary.main,
            color: '#ffffff',
            fontSize: 10,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              IconComponent={MessageCircle}
              tutorialKey="tab-messages"
            />
          ),
        }}
        listeners={
          isAuthenticated
            ? ({ navigation, route }) => ({
                tabPress: (event) => {
                  const state = route.state;
                  
                  // If already on ConversationsList screen, do nothing
                  if (state && state.index === 0 && state.routes[0].name === 'ConversationsList') {
                    return;
                  }
                  
                  // Otherwise, reset to ConversationsList
                  event.preventDefault();
                  navigation.navigate('MessagesTab', {
                    screen: 'ConversationsList',
                  });
                },
              })
            : undefined
        }
      >
        {() =>
          isAuthenticated ? (
            <MessagingNavigator />
          ) : (
            <AuthRequiredScreen message="Autentifică-te pentru a accesa mesajele." />
          )
        }
      </Tab.Screen>
      <Tab.Screen
        name="FavoritesTab"
        options={{
          tabBarLabel: 'Favorite',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              IconComponent={Heart}
              tutorialKey="tab-favorites"
            />
          ),
        }}
        listeners={
          isAuthenticated
            ? ({ navigation, route }) => ({
                tabPress: (event) => {
                  const state = route.state;
                  
                  // If already on Favorites screen, do nothing
                  if (state && state.index === 0 && state.routes[0].name === 'Favorites') {
                    return;
                  }
                  
                  // Otherwise, reset to Favorites screen
                  event.preventDefault();
                  navigation.navigate('FavoritesTab', {
                    screen: 'Favorites',
                  });
                },
              })
            : undefined
        }
      >
        {() =>
          isAuthenticated ? (
            <FavoritesNavigator />
          ) : (
            <AuthRequiredScreen message="Autentifică-te pentru a accesa favoritele." />
          )
        }
      </Tab.Screen>
      <Tab.Screen
        name="ProfileTab"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              IconComponent={User}
              tutorialKey="tab-profile"
            />
          ),
        }}
        listeners={
          isAuthenticated
            ? ({ navigation, route }) => ({
                tabPress: (event) => {
                  // Get current state of ProfileTab
                  const state = route.state;
                  
                  // If we're already on the Profile screen (root of stack), do nothing
                  if (state && state.index === 0 && state.routes[0].name === 'Profile') {
                    return;
                  }
                  
                  // Otherwise, reset to Profile screen
                  event.preventDefault();
                  navigation.navigate('ProfileTab', {
                    screen: 'Profile',
                  });
                },
              })
            : undefined
        }
      >
        {() =>
          isAuthenticated ? (
            <ProfileNavigator />
          ) : (
            <AuthRequiredScreen message="Autentifică-te pentru a accesa profilul." />
          )
        }
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});

export default MainNavigator;
