/**
 * 🔍 SEARCH INTERFACES
 */

import type { IPropertySearchParams } from './property.interface.js';

// ============================================================================
// SAVED SEARCHES
// ============================================================================

/**
 * Căutare salvată
 */
export interface ISavedSearch {
  id: string;
  userId: string;
  
  name: string;
  params: IPropertySearchParams;
  
  // Alerte
  alertsEnabled: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
  lastAlertAt?: Date | string;
  
  // Match count
  newMatchesCount: number;
  totalMatchesCount: number;
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Creare căutare salvată
 */
export interface ICreateSavedSearchDto {
  name: string;
  params: IPropertySearchParams;
  alertsEnabled?: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

/**
 * Actualizare căutare salvată
 */
export interface IUpdateSavedSearchDto {
  name?: string;
  params?: IPropertySearchParams;
  alertsEnabled?: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

// ============================================================================
// SEARCH SUGGESTIONS
// ============================================================================

/**
 * Sugestie căutare
 */
export interface ISearchSuggestion {
  type: 'LOCATION' | 'PROPERTY_TYPE' | 'RECENT' | 'POPULAR';
  text: string;
  subtitle?: string;
  icon?: string;
  params?: Partial<IPropertySearchParams>;
}

/**
 * Răspuns sugestii
 */
export interface ISearchSuggestionsResponse {
  suggestions: ISearchSuggestion[];
  recentSearches: ISearchSuggestion[];
  popularSearches: ISearchSuggestion[];
}

// ============================================================================
// MAP SEARCH
// ============================================================================

/**
 * Cluster pe hartă
 */
export interface IMapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  
  // Bounds pentru zoom in
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  
  // Price range în cluster
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

/**
 * Pin pe hartă
 */
export interface IMapPin {
  id: string;
  propertyId: string;
  lat: number;
  lng: number;
  
  // Pentru preview
  price: number;
  currency: string;
  displayPrice: string;
  
  isPromoted: boolean;
  isFavorite: boolean;
}

/**
 * Răspuns map search
 */
export interface IMapSearchResponse {
  clusters: IMapCluster[];
  pins: IMapPin[];
  
  // Dacă sunt prea multe pentru pins, returnează clusters
  displayMode: 'PINS' | 'CLUSTERS' | 'MIXED';
  
  total: number;
}

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

/**
 * Rezultat autocomplete locație
 */
export interface ILocationAutocomplete {
  id: string;
  type: 'CITY' | 'DISTRICT' | 'NEIGHBORHOOD' | 'STREET' | 'ADDRESS';
  
  text: string;
  secondaryText?: string;
  
  // Pentru populare params
  city?: string;
  district?: string;
  neighborhood?: string;
  
  // Coordonate (dacă disponibile)
  lat?: number;
  lng?: number;
}
