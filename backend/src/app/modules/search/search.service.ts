/**
 * 🔍 SEARCH SERVICE - Full-text Search cu PostgreSQL
 * 
 * Funcționalități:
 * - Full-text search în titlu, descriere, oraș, cartier
 * - Filtre avansate (preț, camere, suprafață, etc.)
 * - Sortare multiplă
 * - Paginare
 * - Căutare pe hartă (bounding box)
 * - Sugestii autocomplete
 * - Căutări salvate
 */

import { Injectable, Logger } from '@nestjs/common';
import { Listing } from '../../db/entities/listing.entity.js';
import { ListingImage } from '../../db/entities/listingImage.entity.js';
import { User } from '../../db/entities/user.entity.js';
import { SubscriptionService } from '../monetization/services/subscription.service.js';
import { Op, literal, fn, col } from 'sequelize';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SearchFilters {
  // Text search
  query?: string;
  
  // Location
  city?: string;
  neighborhood?: string;
  
  // Bounding box for map
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  
  // Price range
  priceMin?: number;
  priceMax?: number;

  // Transaction & property type
  transactionType?: string;
  propertyType?: string;
  
  // Property details
  rooms?: number;
  roomsMin?: number;
  roomsMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  floorMin?: number;
  floorMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  
  // Features
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  petFriendly?: boolean;
  amenities?: string[];
  
  // Rent type
  rentType?: 'camera' | 'garsoniera' | 'ap2' | 'ap3' | 'casa';
  
  // Status
  status?: string;
  
  // Exclude agencies
  excludeAgencies?: boolean;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'relevance';

  // Internal (not exposed in query schema)
  viewerUserId?: number;
}

export interface SearchResult {
  data: (Listing & { isPromoted?: boolean; promotionBadge?: boolean })[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  facets?: {
    cities: { name: string; count: number }[];
    priceRanges: { label: string; min: number; max: number; count: number }[];
    roomCounts: { rooms: number; count: number }[];
  };
}

// Promoted listing info from monetization module
interface PromotedListingInfo {
  listingId: number;
  boostMultiplier: number;
  showBadge: boolean;
  showOnHomepage: boolean;
}

interface MapListingRow {
  id: number;
  lat: number;
  lng: number;
  priceEur: number;
  rooms: number;
  title: string;
  status: string;
  publicFrom: Date | null;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  private async getVisibleStatuses(viewerUserId?: number): Promise<Array<'public' | 'early_access'>> {
    if (!viewerUserId) {
      return ['public'];
    }

    const hasEarlyAccess = await this.subscriptionService.hasEarlyAccess(viewerUserId);
    return hasEarlyAccess ? ['public', 'early_access'] : ['public'];
  }

  /**
   * Obține lista de listing-uri promovate
   * Lazy import pentru a evita dependențe circulare
   */
  private async getPromotedListings(): Promise<Map<number, PromotedListingInfo>> {
    try {
      const { ListingPromotion } = await import('../../db/entities/listing-promotion.entity.js');
      const now = new Date();

      const promotions = await ListingPromotion.findAll({
        where: {
          status: 'active',
          startDate: { [Op.lte]: now },
          endDate: { [Op.gt]: now },
        },
        attributes: ['listingId', 'searchBoostMultiplier', 'showBadge', 'showOnHomepage'],
        raw: true,
      });

      const map = new Map<number, PromotedListingInfo>();
      for (const p of promotions) {
        map.set(p.listingId, {
          listingId: p.listingId,
          boostMultiplier: Number(p.searchBoostMultiplier),
          showBadge: p.showBadge,
          showOnHomepage: p.showOnHomepage,
        });
      }

      return map;
    } catch (error) {
      this.logger.warn('Could not load promoted listings:', error);
      return new Map();
    }
  }

  /**
   * Căutare principală cu full-text și filtre
   * PROMOVARE: Listing-urile promovate sunt afișate primele
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const offset = (page - 1) * limit;
    const visibleStatuses = await this.getVisibleStatuses(filters.viewerUserId);

    // Build WHERE conditions
    const whereConditions: any[] = [
      { status: { [Op.in]: visibleStatuses } },
    ];

    // Full-text search using PostgreSQL
    if (filters.query && filters.query.trim()) {
      const searchQuery = this.sanitizeSearchQuery(filters.query);
      
      // Use PostgreSQL full-text search with Romanian configuration
      // Search in: title, description, city, neighborhood
      whereConditions.push(
        literal(`(
          to_tsvector('romanian', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(neighborhood, ''))
          @@ plainto_tsquery('romanian', '${searchQuery}')
        )`)
      );
    }

    // City filter - simple ILIKE search (works well for Moldovan cities)
    if (filters.city) {
      this.logger.log(`City filter: "${filters.city}"`);
      whereConditions.push({ city: { [Op.iLike]: `%${filters.city}%` } });
    }

    // Neighborhood filter - simple ILIKE search
    if (filters.neighborhood) {
      this.logger.log(`Neighborhood filter: "${filters.neighborhood}"`);
      whereConditions.push({ neighborhood: { [Op.iLike]: `%${filters.neighborhood}%` } });
    }

    // Bounding box for map
    if (filters.bounds) {
      whereConditions.push({
        lat: { [Op.between]: [filters.bounds.south, filters.bounds.north] },
        lng: { [Op.between]: [filters.bounds.west, filters.bounds.east] },
      });
    }

    // Transaction and property type
    if (filters.transactionType) {
      whereConditions.push({ transactionType: filters.transactionType });
    }
    if (filters.propertyType) {
      whereConditions.push({ propertyType: filters.propertyType });
    }

    // Price range (use != null to check both null and undefined)
    if (filters.priceMin != null) {
      whereConditions.push({ priceEur: { [Op.gte]: filters.priceMin } });
    }
    if (filters.priceMax != null) {
      whereConditions.push({ priceEur: { [Op.lte]: filters.priceMax } });
    }

    // Rooms
    if (filters.rooms != null) {
      whereConditions.push({ rooms: filters.rooms });
    }
    if (filters.roomsMin != null) {
      whereConditions.push({ rooms: { [Op.gte]: filters.roomsMin } });
    }
    if (filters.roomsMax != null) {
      whereConditions.push({ rooms: { [Op.lte]: filters.roomsMax } });
    }

    // Bedrooms
    if (filters.bedroomsMin != null) {
      whereConditions.push({ bedrooms: { [Op.gte]: filters.bedroomsMin } });
    }
    if (filters.bedroomsMax != null) {
      whereConditions.push({ bedrooms: { [Op.lte]: filters.bedroomsMax } });
    }

    // Bathrooms
    if (filters.bathroomsMin != null) {
      whereConditions.push({ bathrooms: { [Op.gte]: filters.bathroomsMin } });
    }
    if (filters.bathroomsMax != null) {
      whereConditions.push({ bathrooms: { [Op.lte]: filters.bathroomsMax } });
    }

    // Floor
    if (filters.floorMin != null) {
      whereConditions.push({ floor: { [Op.gte]: filters.floorMin } });
    }
    if (filters.floorMax != null) {
      whereConditions.push({ floor: { [Op.lte]: filters.floorMax } });
    }

    // Year built
    if (filters.yearBuiltMin != null) {
      whereConditions.push({ yearBuilt: { [Op.gte]: filters.yearBuiltMin } });
    }
    if (filters.yearBuiltMax != null) {
      whereConditions.push({ yearBuilt: { [Op.lte]: filters.yearBuiltMax } });
    }

    // Surface
    if (filters.surfaceMin != null) {
      whereConditions.push({ surfaceSqm: { [Op.gte]: filters.surfaceMin } });
    }
    if (filters.surfaceMax != null) {
      whereConditions.push({ surfaceSqm: { [Op.lte]: filters.surfaceMax } });
    }

    // Boolean features (check for explicit true/false, not null)
    if (filters.isFurnished === true || filters.isFurnished === false) {
      whereConditions.push({ isFurnished: filters.isFurnished });
    }
    if (filters.hasCentralHeating === true || filters.hasCentralHeating === false) {
      whereConditions.push({ hasCentralHeating: filters.hasCentralHeating });
    }
    if (filters.petFriendly === true || filters.petFriendly === false) {
      whereConditions.push({ petFriendly: filters.petFriendly });
    }

    // Amenities
    if (filters.amenities && filters.amenities.length > 0) {
      whereConditions.push({ amenities: { [Op.contains]: filters.amenities } });
    }

    // Rent type
    if (filters.rentType) {
      whereConditions.push({ rentType: filters.rentType });
    }

    // Exclude agencies
    if (filters.excludeAgencies) {
      whereConditions.push({ isAgency: false });
    }

    // Build ORDER clause
    const order = this.buildOrderClause(filters.sortBy, filters.query);

    this.logger.log(`Search whereConditions count: ${whereConditions.length}`);

    // Get promoted listings for prioritization
    const promotedListings = await this.getPromotedListings();
    const promotedIds = Array.from(promotedListings.keys());

    // Execute query
    const { count, rows } = await Listing.findAndCountAll({
      where: { [Op.and]: whereConditions },
      include: [
        {
          model: ListingImage,
          as: 'images',
          limit: 5,
          order: [['order', 'ASC']],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'],
        },
      ],
      order,
      limit: limit + promotedIds.length, // Fetch extra to allow reordering
      offset: Math.max(0, offset - (page === 1 ? 0 : promotedIds.length)),
      distinct: true,
    });

    // Sort results: promoted listings first, then by original order
    // Also add promotion metadata to results
    const sortedRows = this.sortWithPromotedFirst(rows, promotedListings);

    // Apply limit after sorting
    const finalRows = sortedRows.slice(0, limit);
    const earlyAccessCount = finalRows.filter((item) => item.status === 'early_access').length;

    if (earlyAccessCount > 0) {
      this.logger.log(
        `[METRIC] search.search served early_access=${earlyAccessCount} total=${finalRows.length} viewer=${filters.viewerUserId || 'anonymous'}`,
      );
    }

    const totalPages = Math.ceil(count / limit);

    return {
      data: finalRows,
      meta: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Sortează rezultatele cu listing-urile promovate primele
   * Adaugă metadata de promovare la rezultate
   */
  private sortWithPromotedFirst(
    rows: Listing[],
    promotedListings: Map<number, PromotedListingInfo>,
  ): (Listing & { isPromoted?: boolean; promotionBadge?: boolean })[] {
    // Split into promoted and non-promoted
    const promoted: (Listing & { isPromoted?: boolean; promotionBadge?: boolean })[] = [];
    const nonPromoted: (Listing & { isPromoted?: boolean; promotionBadge?: boolean })[] = [];

    for (const row of rows) {
      const promoInfo = promotedListings.get(row.id);
      if (promoInfo) {
        // Add promotion metadata
        const enhancedRow = row as Listing & { isPromoted?: boolean; promotionBadge?: boolean };
        enhancedRow.isPromoted = true;
        enhancedRow.promotionBadge = promoInfo.showBadge;
        promoted.push(enhancedRow);
      } else {
        const enhancedRow = row as Listing & { isPromoted?: boolean; promotionBadge?: boolean };
        enhancedRow.isPromoted = false;
        enhancedRow.promotionBadge = false;
        nonPromoted.push(enhancedRow);
      }
    }

    // Sort promoted by boost multiplier (higher first)
    promoted.sort((a, b) => {
      const aBoost = promotedListings.get(a.id)?.boostMultiplier || 1;
      const bBoost = promotedListings.get(b.id)?.boostMultiplier || 1;
      return bBoost - aBoost;
    });

    // Combine: promoted first, then non-promoted
    return [...promoted, ...nonPromoted];
  }

  /**
   * Sugestii autocomplete pentru căutare
   */
  async suggestions(
    query: string,
    viewerUserId?: number,
  ): Promise<{ text: string; type: string; count?: number }[]> {
    if (!query || query.length < 2) return [];

    const searchQuery = this.sanitizeSearchQuery(query);
    const visibleStatuses = await this.getVisibleStatuses(viewerUserId);
    const suggestions: { text: string; type: string; count?: number }[] = [];

    // Search cities
    const cities = await Listing.findAll({
      attributes: [
        'city',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        city: { [Op.iLike]: `%${searchQuery}%` },
        status: { [Op.in]: visibleStatuses },
      },
      group: ['city'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 5,
      raw: true,
    }) as unknown as { city: string; count: string }[];

    for (const city of cities) {
      suggestions.push({
        text: city.city,
        type: 'city',
        count: parseInt(city.count),
      });
    }

    // Search neighborhoods
    const neighborhoods = await Listing.findAll({
      attributes: [
        'neighborhood',
        'city',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        neighborhood: { [Op.iLike]: `%${searchQuery}%` },
        status: { [Op.in]: visibleStatuses },
      },
      group: ['neighborhood', 'city'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 5,
      raw: true,
    }) as unknown as { neighborhood: string; city: string; count: string }[];

    for (const n of neighborhoods) {
      suggestions.push({
        text: `${n.neighborhood}, ${n.city}`,
        type: 'neighborhood',
        count: parseInt(n.count),
      });
    }

    return suggestions.slice(0, 10);
  }

  /**
   * Date pentru afișare pe hartă (lightweight)
   * Include informații despre promoții
   */
  async getMapData(filters: SearchFilters) {
    const visibleStatuses = await this.getVisibleStatuses(filters.viewerUserId);

    // Reuse search logic but only return coordinates
    const whereConditions: any[] = [
      { status: { [Op.in]: visibleStatuses } },
      { lat: { [Op.ne]: null } },
      { lng: { [Op.ne]: null } },
    ];

    // Apply same filters as search
    if (filters.city) {
      whereConditions.push({ city: { [Op.iLike]: `%${filters.city}%` } });
    }
    if (filters.neighborhood) {
      whereConditions.push({ neighborhood: { [Op.iLike]: `%${filters.neighborhood}%` } });
    }
    if (filters.bounds) {
      whereConditions.push({
        lat: { [Op.between]: [filters.bounds.south, filters.bounds.north] },
        lng: { [Op.between]: [filters.bounds.west, filters.bounds.east] },
      });
    }
    if (filters.priceMin !== undefined) {
      whereConditions.push({ priceEur: { [Op.gte]: filters.priceMin } });
    }
    if (filters.priceMax !== undefined) {
      whereConditions.push({ priceEur: { [Op.lte]: filters.priceMax } });
    }
    if (filters.rooms !== undefined) {
      whereConditions.push({ rooms: filters.rooms });
    }

    const listings = await Listing.findAll({
      attributes: ['id', 'lat', 'lng', 'priceEur', 'rooms', 'title', 'status', 'publicFrom'],
      where: { [Op.and]: whereConditions },
      limit: 500,
      raw: true,
    }) as unknown as MapListingRow[];

    const earlyAccessCount = listings.filter((item) => item.status === 'early_access').length;
    if (earlyAccessCount > 0) {
      this.logger.log(
        `[METRIC] search.getMapData served early_access=${earlyAccessCount} total=${listings.length} viewer=${filters.viewerUserId || 'anonymous'}`,
      );
    }

    // Get promoted listings
    const promotedListings = await this.getPromotedListings();

    // Return as GeoJSON FeatureCollection
    return {
      type: 'FeatureCollection',
      features: listings.map(l => {
        const promoInfo = promotedListings.get(l.id);
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(l.lng), Number(l.lat)],
          },
          properties: {
            id: l.id,
            price: l.priceEur,
            rooms: l.rooms,
            title: l.title,
            status: l.status,
            publicFrom: l.publicFrom,
            isPromoted: !!promoInfo,
            promotionBadge: promoInfo?.showBadge || false,
          },
        };
      }),
    };
  }

  /**
   * Obține facets/agregări pentru filtre
   */
  async getFacets(baseFilters: SearchFilters = {}): Promise<SearchResult['facets']> {
    const visibleStatuses = await this.getVisibleStatuses(baseFilters.viewerUserId);
    const whereBase: any = {
      status: { [Op.in]: visibleStatuses },
    };

    // Cities with counts
    const cities = await Listing.findAll({
      attributes: [
        'city',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: whereBase,
      group: ['city'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 20,
      raw: true,
    }) as unknown as { city: string; count: string }[];

    // Room counts
    const roomCounts = await Listing.findAll({
      attributes: [
        'rooms',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: whereBase,
      group: ['rooms'],
      order: [['rooms', 'ASC']],
      raw: true,
    }) as unknown as { rooms: number; count: string }[];

    // Price ranges
    const priceRanges = [
      { label: 'Sub 300€', min: 0, max: 300, count: 0 },
      { label: '300-500€', min: 300, max: 500, count: 0 },
      { label: '500-700€', min: 500, max: 700, count: 0 },
      { label: '700-1000€', min: 700, max: 1000, count: 0 },
      { label: 'Peste 1000€', min: 1000, max: 99999, count: 0 },
    ];

    for (const range of priceRanges) {
      const count = await Listing.count({
        where: {
          ...whereBase,
          priceEur: { [Op.between]: [range.min, range.max] },
        },
      });
      range.count = count;
    }

    return {
      cities: cities.map(c => ({ name: c.city, count: parseInt(c.count) })),
      roomCounts: roomCounts.map(r => ({ rooms: r.rooms, count: parseInt(r.count) })),
      priceRanges,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private sanitizeSearchQuery(query: string): string {
    // Remove special characters that could break the query
    return query
      .replace(/['"\\;]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  private buildOrderClause(sortBy?: string, hasQuery?: string): [string, string][] {
    switch (sortBy) {
      case 'price_asc':
        return [['priceEur', 'ASC']];
      case 'price_desc':
        return [['priceEur', 'DESC']];
      case 'date_asc':
        return [['postedAt', 'ASC']];
      case 'date_desc':
        return [['postedAt', 'DESC']];
      case 'relevance':
      default:
        // If there's a search query, order by relevance (newest first as fallback)
        return [['postedAt', 'DESC']];
    }
  }
}

