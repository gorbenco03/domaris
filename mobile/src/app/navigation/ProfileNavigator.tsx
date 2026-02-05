/**
 * RIVA - Profile Navigator
 * Stack navigator for profile related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileStackParamList } from '@/app/navigation/types';
import {
  ProfileScreen,
  EditProfileScreen,
  SettingsScreen,
  ChangePasswordScreen,
  ReviewsScreen,
  PublicProfileScreen,
} from '@/features/profile/screens';

// Sprint 1: New profile screens
import { ProfileEditScreen } from '@/features/profile/ProfileEditScreen';
import { NotificationSettingsScreen } from '@/features/profile/NotificationSettingsScreen';
import {
  VerificationHubScreen,
  IdentityVerificationScreen,
  OwnershipVerificationScreen,
} from '@/features/profile/screens/verification';
import { CreatePropertyWizard, MyPropertiesScreen, EditPropertyScreen } from '@/features/properties/screens';
import { ViewingsListScreen, ViewingDetailScreen, RequestViewingScreen, AvailabilitySettingsScreen } from '@/features/viewings';
import { NotificationsCenterScreen, NotificationPreferencesScreen } from '@/features/notifications';
import { PropertyAnalyticsScreen } from '@/features/analytics';
import { PricingScreen, BoostPurchaseScreen } from '@/features/monetization';
import { AIChatScreen, ListingAnalysisScreen, AiConversationsListScreen } from '@/features/ai';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      {/* Sprint 1: New profile screens */}
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="VerificationHub" component={VerificationHubScreen} />
      <Stack.Screen name="IdentityVerification" component={IdentityVerificationScreen} />
      <Stack.Screen name="OwnershipVerification" component={OwnershipVerificationScreen} />
      {/* Properties */}
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} />
      <Stack.Screen name="CreateProperty" component={CreatePropertyWizard} />
      <Stack.Screen name="EditProperty" component={EditPropertyScreen} />
      <Stack.Screen name="PropertyStats" component={PropertyAnalyticsScreen} />
      {/* Viewings */}
      <Stack.Screen name="Viewings" component={ViewingsListScreen} />
      <Stack.Screen name="ViewingDetail" component={ViewingDetailScreen} />
      <Stack.Screen name="RequestViewing" component={RequestViewingScreen} />
      <Stack.Screen name="AvailabilitySettings" component={AvailabilitySettingsScreen} />
      {/* Notifications */}
      <Stack.Screen name="Notifications" component={NotificationsCenterScreen} />
      {/* Monetization */}
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen
        name="BoostPurchase"
        component={BoostPurchaseScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      {/* AI Assistant */}
      <Stack.Screen name="AIChat" component={AIChatScreen} />
      <Stack.Screen name="AiConversationsList" component={AiConversationsListScreen} />
      <Stack.Screen name="ListingAnalysis" component={ListingAnalysisScreen} />
      {/* Reviews and Public Profile */}
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </Stack.Navigator>
  );
};

// Temporary placeholder for screens not yet implemented
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/app/providers/ThemeProvider';

const PlaceholderScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.lg,
            },
          ]}
        >
          {route.name}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          În dezvoltare
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Acest ecran va fi implementat în curând
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileNavigator;
