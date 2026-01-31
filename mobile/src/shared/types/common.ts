/**
 * RIVA - Common Types
 * Shared type definitions used across the app
 */

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ============================================
// PROPERTY TYPES
// ============================================

export type PropertyType = 
  | 'apartment' 
  | 'house' 
  | 'villa' 
  | 'studio' 
  | 'penthouse' 
  | 'duplex' 
  | 'land' 
  | 'commercial' 
  | 'office';

export type TransactionType = 'sale' | 'rent';

export type PropertyStatus = 'active' | 'inactive' | 'sold' | 'rented' | 'pending';

export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
  isPrimary: boolean;
}

export interface PropertyLocation {
  address: string;
  city: string;
  sector?: string;
  county: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}

export interface PropertyAmenity {
  id: string;
  name: string;
  icon?: string;
  category: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  transactionType: TransactionType;
  status: PropertyStatus;
  price: number;
  currency: 'EUR' | 'RON';
  pricePerSqm?: number;
  
  // Dimensions
  area: number;
  usableArea?: number;
  landArea?: number;
  
  // Rooms
  rooms: number;
  bedrooms?: number;
  bathrooms: number;
  balconies?: number;
  
  // Building info
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  
  // Features
  parkingSpaces?: number;
  hasGarage?: boolean;
  hasBasement?: boolean;
  hasElevator?: boolean;
  hasFurnished?: boolean;
  
  // Location
  location: PropertyLocation;
  
  // Media
  images: PropertyImage[];
  videoUrl?: string;
  virtualTourUrl?: string;
  
  // Amenities
  amenities: PropertyAmenity[];
  
  // Owner
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  
  // Stats
  viewsCount: number;
  favoritesCount: number;
  messagesCount: number;
  
  // AI Analysis
  aiScore?: number;
  aiSuggestions?: string[];
  
  // Dates
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // User-specific
  isFavorite?: boolean;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface PropertyFilters {
  transactionType?: TransactionType;
  propertyTypes?: PropertyType[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  roomsMin?: number;
  roomsMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  city?: string;
  sector?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  amenities?: string[];
  hasParking?: boolean;
  hasElevator?: boolean;
  hasFurnished?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'area_asc' | 'area_desc';
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: PropertyFilters;
  alertEnabled: boolean;
  createdAt: string;
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Conversation {
  id: string;
  propertyId: string;
  property: {
    id: string;
    title: string;
    image?: string;
    price: number;
  };
  participants: {
    id: string;
    name: string;
    avatar?: string;
    isOwner: boolean;
  }[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// VIEWING TYPES
// ============================================

export type ViewingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled';

export interface Viewing {
  id: string;
  propertyId: string;
  property: {
    id: string;
    title: string;
    image?: string;
    address: string;
  };
  seekerId: string;
  seeker: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  ownerId: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  scheduledAt: string;
  duration: number; // minutes
  status: ViewingStatus;
  notes?: string;
  feedback?: {
    rating: number;
    comment?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'message' 
  | 'viewing_request' 
  | 'viewing_confirmed' 
  | 'viewing_cancelled'
  | 'property_viewed'
  | 'property_favorited'
  | 'new_property_match'
  | 'price_drop'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];
