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
import { Op, literal, fn, col, where } from 'sequelize';

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

  // Homepage promoted only
  showOnHomepage?: boolean;
  
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
  badgeText: string | null;
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
  private promotedCache: { map: Map<number, PromotedListingInfo>; expiresAt: number } | null = null;
  private readonly PROMOTED_CACHE_TTL_MS = 30_000; // 30 seconds

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
    const now = Date.now();
    if (this.promotedCache && this.promotedCache.expiresAt > now) {
      return this.promotedCache.map;
    }

    try {
      const { ListingPromotion } = await import('../../db/entities/listing-promotion.entity.js');
      const nowDate = new Date();

      const { PromotionPlan } = await import('../../db/entities/promotion-plan.entity.js');

      const promotions = await ListingPromotion.findAll({
        where: {
          status: 'active',
          startDate: { [Op.lte]: nowDate },
          endDate: { [Op.gt]: nowDate },
        },
        attributes: ['listingId', 'searchBoostMultiplier', 'showBadge', 'showOnHomepage'],
        include: [{ model: PromotionPlan, as: 'promotionPlan', attributes: ['badgeText'] }],
        raw: true,
        nest: true,
      });

      const map = new Map<number, PromotedListingInfo>();
      for (const p of promotions as any[]) {
        map.set(p.listingId, {
          listingId: p.listingId,
          boostMultiplier: Number(p.searchBoostMultiplier),
          showBadge: p.showBadge,
          showOnHomepage: p.showOnHomepage,
          badgeText: p.promotionPlan?.badgeText || null,
        });
      }

      this.promotedCache = { map, expiresAt: now + this.PROMOTED_CACHE_TTL_MS };
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
      whereConditions.push(this.buildAccentInsensitiveContainsCondition('city', filters.city));
    }

    // Neighborhood filter - simple ILIKE search
    if (filters.neighborhood) {
      this.logger.log(`Neighborhood filter: "${filters.neighborhood}"`);
      whereConditions.push(this.buildAccentInsensitiveContainsCondition('neighborhood', filters.neighborhood));
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

    // Homepage promoted only: join with listing_promotions
    if (filters.showOnHomepage) {
      const { ListingPromotion } = await import('../../db/entities/listing-promotion.entity.js');
      const now = new Date();
      const homepagePromotions = await ListingPromotion.findAll({
        where: {
          status: 'active',
          showOnHomepage: true,
          startDate: { [Op.lte]: now },
          endDate: { [Op.gt]: now },
        },
        attributes: ['listingId'],
        raw: true,
      });
      const homepageIds = homepagePromotions.map((p: any) => p.listingId);
      if (homepageIds.length === 0) {
        return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
      }
      whereConditions.push({ id: { [Op.in]: homepageIds } });
    }

    // Build ORDER clause
    const order = this.buildOrderClause(filters.sortBy, filters.query);

    this.logger.log(`Search whereConditions count: ${whereConditions.length}`);

    const include: any[] = [
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
    ];

    // PROMOTED INTERLEAVING:
    // Insert 1 promoted listing every PROMOTED_INTERVAL normal results.
    // Promoted are sorted by: boostMultiplier DESC, then startDate ASC (first paid = first shown at equal multiplier).
    // On page N, we skip the first (page-1)*promotedPerPage promoted slots.
    const PROMOTED_INTERVAL = 4; // 1 promoted every 4 normal results
    const promotedSlotsPerPage = Math.floor(limit / PROMOTED_INTERVAL); // e.g. 20/4 = 5 slots
    const promotedOffset = (page - 1) * promotedSlotsPerPage;

    // Fetch promoted map and matching promoted IDs in parallel
    const promotedListings = await this.getPromotedListings();
    const promotedIds = Array.from(promotedListings.keys());

    // Fetch the promoted listings matching current filters, sorted correctly
    let allMatchingPromoted: any[] = [];
    if (promotedIds.length > 0) {
      const promotedDbRows = await Listing.findAll({
        where: {
          [Op.and]: [
            ...whereConditions,
            { id: { [Op.in]: promotedIds } },
          ],
        },
        attributes: ['id'],
        raw: true,
      }) as any[];

      // Sort by multiplier DESC, then startDate ASC (tie-break: first paid wins)
      allMatchingPromoted = promotedDbRows
        .map((r: any) => ({ id: r.id, info: promotedListings.get(r.id) }))
        .filter((r: any) => r.info)
        .sort((a: any, b: any) => {
          const diff = b.info.boostMultiplier - a.info.boostMultiplier;
          if (diff !== 0) return diff;
          return (a.info.startDate?.getTime?.() ?? 0) - (b.info.startDate?.getTime?.() ?? 0);
        });
    }

    // Slice the promoted listings for this page
    const pagePromotedSlice = allMatchingPromoted.slice(
      promotedOffset,
      promotedOffset + promotedSlotsPerPage,
    );
    const pagePromotedIds = pagePromotedSlice.map((r: any) => r.id);

    // Fetch full data for this page's promoted listings (preserving order)
    let promotedFull: any[] = [];
    if (pagePromotedIds.length > 0) {
      const promotedDbFull = await Listing.findAll({
        where: { id: { [Op.in]: pagePromotedIds } },
        include,
      }) as any[];

      // Restore sort order (findAll doesn't guarantee order for IN clause)
      const promotedById = new Map(promotedDbFull.map((r) => [r.id, r]));
      promotedFull = pagePromotedIds
        .map((id: number) => promotedById.get(id))
        .filter(Boolean)
        .map((row: any) => {
          const promoInfo = promotedListings.get(row.id);
          const plain = row.toJSON();
          plain.isPromoted = true;
          plain.promotionBadge = promoInfo?.showBadge || false;
          plain.promotionBadgeText = promoInfo?.badgeText || null;
          return plain;
        });
    }

    // Fetch normal listings (excluding ALL matching promoted to avoid duplicates across pages)
    const allPromotedMatchingIds = allMatchingPromoted.map((r: any) => r.id);
    const normalWhereConditions =
      allPromotedMatchingIds.length > 0
        ? [...whereConditions, { id: { [Op.notIn]: allPromotedMatchingIds } }]
        : whereConditions;

    // Normal slots per page = limit minus promoted slots for this page
    const normalLimit = limit - promotedFull.length;
    const normalOffset = (page - 1) * (limit - promotedSlotsPerPage);

    // Run count and rows fetch in parallel for performance
    const [totalCount, rows] = await Promise.all([
      Listing.count({ where: { [Op.and]: whereConditions } }).then(Number),
      Listing.findAll({
        where: { [Op.and]: normalWhereConditions },
        include,
        order,
        limit: Math.max(1, normalLimit),
        offset: normalOffset,
        distinct: true,
      } as any),
    ]);

    // Annotate normal rows as plain objects
    const normalRows = rows.map((row) => {
      const plain = row.toJSON() as any;
      plain.isPromoted = false;
      plain.promotionBadge = false;
      plain.promotionBadgeText = null;
      return plain;
    });

    // Interleave: insert 1 promoted every PROMOTED_INTERVAL normal results
    // e.g. [N, N, N, N, P, N, N, N, N, P, ...]
    const finalRows: any[] = [];
    let normalIdx = 0;
    let promotedIdx = 0;

    while (finalRows.length < limit) {
      // Insert PROMOTED_INTERVAL normal results
      for (let i = 0; i < PROMOTED_INTERVAL && finalRows.length < limit; i++) {
        if (normalIdx < normalRows.length) {
          finalRows.push(normalRows[normalIdx++]);
        } else {
          break;
        }
      }
      // Insert 1 promoted
      if (promotedIdx < promotedFull.length && finalRows.length < limit) {
        finalRows.push(promotedFull[promotedIdx++]);
      } else if (normalIdx >= normalRows.length) {
        break;
      }
    }
    const earlyAccessCount = finalRows.filter((item) => item.status === 'early_access').length;

    if (earlyAccessCount > 0) {
      this.logger.log(
        `[METRIC] search.search served early_access=${earlyAccessCount} total=${finalRows.length} viewer=${filters.viewerUserId || 'anonymous'}`,
      );
    }

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: finalRows,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
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

  private normalizeForAccentInsensitiveMatch(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ș|ş/g, 's')
      .replace(/ț|ţ/g, 't')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildAccentInsensitiveContainsCondition(field: string, value: string) {
    return where(
      fn(
        'translate',
        fn('lower', fn('coalesce', col(field), '')),
        'ăâîșşțţ',
        'aaisstt',
      ),
      {
        [Op.like]: `%${this.normalizeForAccentInsensitiveMatch(value)}%`,
      },
    );
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

