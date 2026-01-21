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
  
  // Property details
  rooms?: number;
  roomsMin?: number;
  roomsMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  
  // Features
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  petFriendly?: boolean;
  
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
}

export interface SearchResult {
  data: Listing[];
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

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  /**
   * Căutare principală cu full-text și filtre
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50);
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions: any[] = [
      { status: { [Op.in]: ['public', 'early_access'] } },
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

    // City filter
    if (filters.city) {
      whereConditions.push({
        city: { [Op.iLike]: `%${filters.city}%` },
      });
    }

    // Neighborhood filter
    if (filters.neighborhood) {
      whereConditions.push({
        neighborhood: { [Op.iLike]: `%${filters.neighborhood}%` },
      });
    }

    // Bounding box for map
    if (filters.bounds) {
      whereConditions.push({
        lat: { [Op.between]: [filters.bounds.south, filters.bounds.north] },
        lng: { [Op.between]: [filters.bounds.west, filters.bounds.east] },
      });
    }

    // Price range
    if (filters.priceMin !== undefined) {
      whereConditions.push({ priceEur: { [Op.gte]: filters.priceMin } });
    }
    if (filters.priceMax !== undefined) {
      whereConditions.push({ priceEur: { [Op.lte]: filters.priceMax } });
    }

    // Rooms
    if (filters.rooms !== undefined) {
      whereConditions.push({ rooms: filters.rooms });
    }
    if (filters.roomsMin !== undefined) {
      whereConditions.push({ rooms: { [Op.gte]: filters.roomsMin } });
    }
    if (filters.roomsMax !== undefined) {
      whereConditions.push({ rooms: { [Op.lte]: filters.roomsMax } });
    }

    // Surface
    if (filters.surfaceMin !== undefined) {
      whereConditions.push({ surfaceSqm: { [Op.gte]: filters.surfaceMin } });
    }
    if (filters.surfaceMax !== undefined) {
      whereConditions.push({ surfaceSqm: { [Op.lte]: filters.surfaceMax } });
    }

    // Boolean features
    if (filters.isFurnished !== undefined) {
      whereConditions.push({ isFurnished: filters.isFurnished });
    }
    if (filters.hasCentralHeating !== undefined) {
      whereConditions.push({ hasCentralHeating: filters.hasCentralHeating });
    }
    if (filters.petFriendly !== undefined) {
      whereConditions.push({ petFriendly: filters.petFriendly });
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
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows,
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
   * Sugestii autocomplete pentru căutare
   */
  async suggestions(query: string): Promise<{ text: string; type: string; count?: number }[]> {
    if (!query || query.length < 2) return [];

    const searchQuery = this.sanitizeSearchQuery(query);
    const suggestions: { text: string; type: string; count?: number }[] = [];

    // Search cities
    const cities = await Listing.findAll({
      attributes: [
        'city',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        city: { [Op.iLike]: `%${searchQuery}%` },
        status: { [Op.in]: ['public', 'early_access'] },
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
        status: { [Op.in]: ['public', 'early_access'] },
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
   */
  async getMapData(filters: SearchFilters) {
    // Reuse search logic but only return coordinates
    const whereConditions: any[] = [
      { status: { [Op.in]: ['public', 'early_access'] } },
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
      attributes: ['id', 'lat', 'lng', 'priceEur', 'rooms', 'title'],
      where: { [Op.and]: whereConditions },
      limit: 500,
      raw: true,
    });

    // Return as GeoJSON FeatureCollection
    return {
      type: 'FeatureCollection',
      features: listings.map(l => ({
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
        },
      })),
    };
  }

  /**
   * Obține facets/agregări pentru filtre
   */
  async getFacets(baseFilters: SearchFilters = {}): Promise<SearchResult['facets']> {
    const whereBase: any = {
      status: { [Op.in]: ['public', 'early_access'] },
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

