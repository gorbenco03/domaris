/**
 * 🏠 PROPERTY INTERFACES - Conform specificațiilor Mobile
 *
 * Structură nouă cu obiecte nested pentru location și pricing
 */

import type {
  TransactionType,
  PropertyType,
  PropertyStatus,
  Currency,
  PricePeriod,
} from './enums.js';
import type { IPublicUserProfile } from './user.interface.js';

// ============================================================================
// CORE PROPERTY INTERFACE
// ============================================================================

/**
 * Interfața principală Property
 */
export interface IProperty {
  id: string;
  ownerId: string;
  owner?: IPublicUserProfile;

  // Identificatori
  slug: string;

  // Informații de bază
  title: string;
  description: string;
  transactionType: TransactionType;
  propertyType: PropertyType;

  // Locație (obiect nested)
  location: IPropertyLocation;

  // Caracteristici
  characteristics: IPropertyCharacteristics;

  // Preț (obiect nested)
  pricing: IPropertyPricing;

  // Media
  media: IPropertyMedia;

  // Status și timing
  status: PropertyStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  availableFrom?: Date | string | null;

  // Sursa (pentru listings importate)
  source: IPropertySource;

  // Analytics (pentru owner)
  analytics?: IPropertyAnalytics;

  // Flags pentru UI
  isFavorite?: boolean;
  isPromoted?: boolean;
  isNew?: boolean; // Posted in last 24h
}

// ============================================================================
// NESTED OBJECTS
// ============================================================================

/**
 * Locație proprietate
 */
export interface IPropertyLocation {
  country: string;
  city: string;
  district?: string; // Sector, raion
  neighborhood?: string;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  fullAddress?: string; // Adresa afișată
  
  // Coordonate
  lat: number;
  lng: number;
  
  // GeoJSON pentru căutare
  geoPoint?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

/**
 * Caracteristici proprietate
 */
export interface IPropertyCharacteristics {
  // Dimensiuni
  totalArea: number; // mp
  usableArea?: number; // mp
  landArea?: number; // pentru case/terenuri

  // Structură
  rooms: number;
  bedrooms?: number;
  bathrooms: number;
  floor?: number;
  totalFloors?: number;
  
  // Construcție
  yearBuilt?: number;
  buildingType?: string; // bloc vechi, bloc nou, casa
  condition?: 'NEW' | 'RENOVATED' | 'GOOD' | 'NEEDS_RENOVATION';
  
  // Facilități
  isFurnished: boolean;
  furnishingLevel?: 'UNFURNISHED' | 'PARTIALLY' | 'FULLY';
  
  // Utilități
  heating?: 'CENTRAL' | 'INDIVIDUAL' | 'FLOOR' | 'NONE';
  cooling?: boolean;
  parking?: 'NONE' | 'STREET' | 'GARAGE' | 'UNDERGROUND';
  
  // Amenități
  amenities: string[];
  
  // Reguli (pentru chirie)
  rules?: IPropertyRules;
}

/**
 * Reguli proprietate (pentru chirie)
 */
export interface IPropertyRules {
  petsAllowed: boolean;
  smokingAllowed: boolean;
  childrenAllowed: boolean;
  studentsAllowed: boolean;
  shortTermAllowed: boolean;
  genderPreference?: 'MALE' | 'FEMALE' | 'ANY';
  minStayMonths?: number;
  maxOccupants?: number;
}

/**
 * Preț și costuri
 */
export interface IPropertyPricing {
  price: number;
  currency: Currency;
  pricePerSqm?: number;
  
  // Pentru chirie
  period?: PricePeriod;
  deposit?: number;
  depositMonths?: number;
  
  // Costuri adiționale
  utilitiesIncluded: boolean;
  utilitiesEstimate?: number;
  adminFee?: number;
  
  // Negociabil
  isNegotiable: boolean;
  
  // Preț afișat (formatat)
  displayPrice?: string;
}

/**
 * Media proprietate
 */
export interface IPropertyMedia {
  images: IPropertyImage[];
  videos?: IPropertyVideo[];
  virtualTour?: string; // URL
  floorPlan?: string; // URL imagine
}

/**
 * Imagine proprietate
 */
export interface IPropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  isMain: boolean;
  caption?: string;
  order: number;
}

/**
 * Video proprietate
 */
export interface IPropertyVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // seconds
}

/**
 * Sursa proprietate
 */
export interface IPropertySource {
  type: 'MANUAL' | 'FACEBOOK' | 'OTHER';
  externalId?: string;
  externalUrl?: string;
  importedAt?: Date | string;
}

/**
 * Analytics proprietate (pentru owner)
 */
export interface IPropertyAnalytics {
  views: number;
  uniqueViews: number;
  favorites: number;
  inquiries: number;
  viewingRequests: number;
  lastViewedAt?: Date | string;
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * Date pentru crearea unei proprietăți
 */
export interface ICreatePropertyDto {
  title: string;
  description: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  location: Omit<IPropertyLocation, 'geoPoint'>;
  characteristics: IPropertyCharacteristics;
  pricing: Omit<IPropertyPricing, 'displayPrice' | 'pricePerSqm'>;
  availableFrom?: Date | string;
  images?: string[]; // URLs or upload IDs
}

/**
 * Date pentru actualizarea unei proprietăți
 */
export interface IUpdatePropertyDto {
  title?: string;
  description?: string;
  location?: Partial<Omit<IPropertyLocation, 'geoPoint'>>;
  characteristics?: Partial<IPropertyCharacteristics>;
  pricing?: Partial<Omit<IPropertyPricing, 'displayPrice' | 'pricePerSqm'>>;
  status?: PropertyStatus;
  availableFrom?: Date | string;
}

/**
 * Proprietate în listă (summary)
 */
export interface IPropertyListItem {
  id: string;
  slug: string;
  title: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  
  // Location summary
  city: string;
  neighborhood?: string;
  
  // Main characteristics
  rooms: number;
  totalArea: number;
  
  // Price
  price: number;
  currency: Currency;
  displayPrice: string;
  
  // Main image
  mainImage?: string;
  imagesCount: number;
  
  // Status
  status: PropertyStatus;
  isNew: boolean;
  isPromoted: boolean;
  isFavorite?: boolean;
  
  // Owner preview
  owner: {
    id: string;
    firstName: string;
    avatar?: string;
    isVerified: boolean;
  };
  
  createdAt: Date | string;
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Parametri căutare proprietăți
 */
export interface IPropertySearchParams {
  // Text search
  query?: string;
  
  // Filters
  transactionType?: TransactionType;
  propertyTypes?: PropertyType[];
  
  // Location
  city?: string;
  cities?: string[];
  neighborhoods?: string[];
  
  // Area bounds (for map)
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  
  // Near point
  near?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
  
  // Price range
  priceMin?: number;
  priceMax?: number;
  currency?: Currency;
  
  // Characteristics
  roomsMin?: number;
  roomsMax?: number;
  areaMin?: number;
  areaMax?: number;
  
  // Amenities
  amenities?: string[];
  
  // Flags
  isFurnished?: boolean;
  petsAllowed?: boolean;
  
  // Sorting
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'relevance';
  
  // Pagination
  page?: number;
  limit?: number;
}

/**
 * Rezultat căutare paginat
 */
export interface IPropertySearchResult {
  items: IPropertyListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
