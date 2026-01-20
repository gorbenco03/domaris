/**
 * IMOBI - Navigation Types
 * Type definitions for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ============================================
// AUTH STACK
// ============================================

export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  OTPVerification: {
    email?: string;
    phone?: string;
    type: 'email' | 'phone';
  };
  UserTypeSelection: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

// ============================================
// MAIN TABS
// ============================================

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  MessagesTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

// ============================================
// HOME STACK
// ============================================

export type HomeStackParamList = {
  Home: undefined;
  PropertyDetail: { propertyId: string };
  AIChat: undefined;
};

// ============================================
// SEARCH STACK
// ============================================

export type SearchStackParamList = {
  Search: undefined;
  SearchResults: { filters?: object };
  PropertyDetail: { propertyId: string };
  SearchFilters: undefined;
  MapSearch: undefined;
  SavedSearches: undefined;
  AIChat: undefined;
};

// ============================================
// MESSAGES STACK
// ============================================

export type MessagesStackParamList = {
  ConversationsList: undefined;
  Chat: { 
    conversationId: string; 
    propertyId?: string;
    recipientName?: string;
  };
  Templates: undefined;
  Report: { conversationId: string; userId: string; userName: string };
};

// ============================================
// FAVORITES STACK
// ============================================

export type FavoritesStackParamList = {
  Favorites: undefined;
  PropertyDetail: { propertyId: string };
  Compare: { propertyIds: string[] };
};

// ============================================
// PROFILE STACK
// ============================================

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyProperties: undefined;
  CreateProperty: undefined;
  EditProperty: { propertyId: string };
  PropertyStats: { propertyId: string };
  Viewings: undefined;
  ViewingDetail: { viewingId: string };
  RequestViewing: { propertyId: string };
  AvailabilitySettings: undefined;
  Notifications: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  ChangePassword: undefined;
  VerificationHub: undefined;
  AIAnalysis: { propertyId: string };
  // Monetization and AI features
  Pricing: undefined;
  BoostPurchase: { propertyId?: string };
  AIChat: { propertyId?: string };
  ListingAnalysis: { propertyId: string };
  // Reviews and Public Profile
  Reviews: { userId?: string; isOwnProfile?: boolean };
  PublicProfile: { userId: string };
};

// ============================================
// ROOT STACK
// ============================================

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Modal screens
  PropertyDetail: { propertyId: string };
  ImageGallery: { images: string[]; initialIndex?: number };
  Map: { latitude: number; longitude: number; title?: string };
  Notifications: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

// ============================================
// GLOBAL NAVIGATION
// ============================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
