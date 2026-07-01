/**
 * RIVA - Navigation Types
 * Type definitions for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { IProperty, IPropertyListItem } from '@/core/api/types';

// ============================================
// AUTH STACK
// ============================================

export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string; code: string };
  OTPVerification: {
    email: string;
    purpose: 'register' | 'reset-password' | 'verify';
    registerData?: {
      firstName?: string;
      lastName?: string;
      password?: string;
      acceptTerms?: boolean;
      acceptPrivacy?: boolean;
      acceptGdpr?: boolean;
      acceptMarketing?: boolean;
      acceptAnalytics?: boolean;
    };
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
  AIChat: { conversationId?: number };
  AiConversationsList: undefined;
  PropertyInsights: { propertyId: string };
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
  SavedSearchResults: { searchId: number };
  AIChat: { conversationId?: number };
  AiConversationsList: undefined;
  PropertyInsights: { propertyId: string };
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
  PropertyInsights: { propertyId: string };
};

// ============================================
// PROFILE STACK
// ============================================

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  // Sprint 1: New profile screens
  ProfileEdit: undefined;
  NotificationSettings: undefined;
  MyProperties: undefined;
  CreateProperty: undefined;
  EditProperty: { propertyId: string; property?: IProperty | IPropertyListItem };
  PropertyStats: { propertyId: string };
  Viewings: undefined;
  ViewingDetail: { viewingId: string };
  RequestViewing: { propertyId: string; viewingId?: string };
  AvailabilitySettings: undefined;
  Notifications: undefined;
  Settings: undefined;
  NotificationPreferences: undefined;
  ChangePassword: undefined;
  VerificationHub: undefined;
  IdentityVerification: undefined;
  OwnershipVerification: undefined;
  AIAnalysis: { propertyId: string };
  // Monetization and AI features
  Pricing: undefined;
  BoostPurchase: {
    listingId?: number;
    propertyId?: string; // legacy fallback
    listingTitle?: string;
    listingLocation?: string;
    listingPrice?: string;
  };
  AIChat: { conversationId?: number; propertyId?: string };
  AiConversationsList: undefined;
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
