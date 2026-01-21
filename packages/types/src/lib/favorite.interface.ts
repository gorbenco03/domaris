/**
 * ❤️ FAVORITE INTERFACES
 */

import type { IPropertyListItem } from './property.interface.js';

// ============================================================================
// FAVORITES
// ============================================================================

/**
 * Proprietate favorită
 */
export interface IFavorite {
  id: string;
  userId: string;
  propertyId: string;
  property?: IPropertyListItem;
  
  // Optional grupare în liste
  listId?: string;
  
  notes?: string;
  
  createdAt: Date | string;
}

/**
 * Listă de favorite personalizată
 */
export interface IFavoriteList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  
  itemsCount: number;
  
  isDefault: boolean; // Lista principală "Favorite"
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Listă cu preview items
 */
export interface IFavoriteListWithPreview extends IFavoriteList {
  previewImages: string[]; // First 4 property images
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * Adăugare la favorite
 */
export interface IAddFavoriteDto {
  propertyId: string;
  listId?: string;
  notes?: string;
}

/**
 * Creare listă favorite
 */
export interface ICreateFavoriteListDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Actualizare listă
 */
export interface IUpdateFavoriteListDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Mutare între liste
 */
export interface IMoveFavoriteDto {
  favoriteId: string;
  targetListId: string;
}

// ============================================================================
// COMPARE
// ============================================================================

/**
 * Comparație proprietăți
 */
export interface IPropertyComparison {
  properties: IPropertyListItem[];
  comparison: IComparisonMatrix;
}

/**
 * Matrice comparație
 */
export interface IComparisonMatrix {
  price: {
    min: string;
    max: string;
    values: Record<string, number>;
  };
  area: {
    min: string;
    max: string;
    values: Record<string, number>;
  };
  pricePerSqm: {
    min: string;
    max: string;
    values: Record<string, number>;
  };
  rooms: Record<string, number>;
  amenities: Record<string, string[]>;
  highlights: Record<string, string[]>;
}

/**
 * Cerere comparație
 */
export interface IComparePropertiesDto {
  propertyIds: string[];
}
