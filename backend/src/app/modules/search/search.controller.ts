/**
 * 🔍 SEARCH CONTROLLER - Căutare proprietăți
 * 
 * Endpoint-uri:
 * - GET /search - Căutare full-text cu filtre
 * - GET /search/suggestions - Autocomplete
 * - GET /search/map - Date pentru hartă
 * - GET /search/facets - Agregări pentru filtre
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchService, SearchFilters } from './search.service';
import { Public } from '../../core/decorators.js';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Advanced Property Search with Full-text' })
  @ApiQuery({ name: 'query', required: false, description: 'Full-text search query' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'neighborhood', required: false, description: 'Filter by neighborhood' })
  @ApiQuery({ name: 'transactionType', required: false })
  @ApiQuery({ name: 'propertyType', required: false })
  @ApiQuery({ name: 'priceMin', required: false, type: Number, description: 'Minimum price in EUR' })
  @ApiQuery({ name: 'priceMax', required: false, type: Number, description: 'Maximum price in EUR' })
  @ApiQuery({ name: 'rooms', required: false, type: Number, description: 'Exact number of rooms' })
  @ApiQuery({ name: 'roomsMin', required: false, type: Number })
  @ApiQuery({ name: 'roomsMax', required: false, type: Number })
  @ApiQuery({ name: 'bedroomsMin', required: false, type: Number })
  @ApiQuery({ name: 'bedroomsMax', required: false, type: Number })
  @ApiQuery({ name: 'bathroomsMin', required: false, type: Number })
  @ApiQuery({ name: 'bathroomsMax', required: false, type: Number })
  @ApiQuery({ name: 'floorMin', required: false, type: Number })
  @ApiQuery({ name: 'floorMax', required: false, type: Number })
  @ApiQuery({ name: 'yearBuiltMin', required: false, type: Number })
  @ApiQuery({ name: 'yearBuiltMax', required: false, type: Number })
  @ApiQuery({ name: 'surfaceMin', required: false, type: Number })
  @ApiQuery({ name: 'surfaceMax', required: false, type: Number })
  @ApiQuery({ name: 'amenities', required: false, isArray: true })
  @ApiQuery({ name: 'isFurnished', required: false, type: Boolean })
  @ApiQuery({ name: 'hasCentralHeating', required: false, type: Boolean })
  @ApiQuery({ name: 'petFriendly', required: false, type: Boolean })
  @ApiQuery({ name: 'excludeAgencies', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price_asc', 'price_desc', 'date_desc', 'date_asc', 'relevance'] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 50)' })
  @ApiResponse({ status: 200, description: 'Search results with pagination metadata' })
  async search(@Query() filters: Record<string, any>) {
    // Parse numeric values from query strings
    const amenitiesList = Array.isArray(filters.amenities)
      ? filters.amenities
      : filters.amenities
      ? String(filters.amenities)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;

    const parsedFilters: SearchFilters = {
      ...filters,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      rooms: filters.rooms ? Number(filters.rooms) : undefined,
      roomsMin: filters.roomsMin ? Number(filters.roomsMin) : undefined,
      roomsMax: filters.roomsMax ? Number(filters.roomsMax) : undefined,
      bedroomsMin: filters.bedroomsMin ? Number(filters.bedroomsMin) : undefined,
      bedroomsMax: filters.bedroomsMax ? Number(filters.bedroomsMax) : undefined,
      bathroomsMin: filters.bathroomsMin ? Number(filters.bathroomsMin) : undefined,
      bathroomsMax: filters.bathroomsMax ? Number(filters.bathroomsMax) : undefined,
      floorMin: filters.floorMin ? Number(filters.floorMin) : undefined,
      floorMax: filters.floorMax ? Number(filters.floorMax) : undefined,
      yearBuiltMin: filters.yearBuiltMin ? Number(filters.yearBuiltMin) : undefined,
      yearBuiltMax: filters.yearBuiltMax ? Number(filters.yearBuiltMax) : undefined,
      surfaceMin: filters.surfaceMin ? Number(filters.surfaceMin) : undefined,
      surfaceMax: filters.surfaceMax ? Number(filters.surfaceMax) : undefined,
      page: filters.page ? Number(filters.page) : 1,
      limit: filters.limit ? Number(filters.limit) : 20,
      amenities: amenitiesList,
      isFurnished: filters.isFurnished === 'true' as unknown as boolean ? true : 
                   filters.isFurnished === 'false' as unknown as boolean ? false : undefined,
      hasCentralHeating: filters.hasCentralHeating === 'true' as unknown as boolean ? true :
                         filters.hasCentralHeating === 'false' as unknown as boolean ? false : undefined,
      petFriendly: filters.petFriendly === 'true' as unknown as boolean ? true :
                   filters.petFriendly === 'false' as unknown as boolean ? false : undefined,
      excludeAgencies: filters.excludeAgencies === 'true' as unknown as boolean ? true : false,
    };

    return this.searchService.search(parsedFilters);
  }

  @Public()
  @Get('suggestions')
  @ApiOperation({ summary: 'Search Autocomplete Suggestions' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 characters)' })
  @ApiResponse({ status: 200, description: 'List of suggestions with type and count' })
  async suggestions(@Query('q') query: string) {
    return this.searchService.suggestions(query);
  }

  @Public()
  @Get('map')
  @ApiOperation({ summary: 'Get Map Data (GeoJSON)' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'transactionType', required: false })
  @ApiQuery({ name: 'propertyType', required: false })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'rooms', required: false, type: Number })
  @ApiQuery({ name: 'bedroomsMin', required: false, type: Number })
  @ApiQuery({ name: 'bedroomsMax', required: false, type: Number })
  @ApiQuery({ name: 'north', required: false, type: Number, description: 'Bounding box north' })
  @ApiQuery({ name: 'south', required: false, type: Number, description: 'Bounding box south' })
  @ApiQuery({ name: 'east', required: false, type: Number, description: 'Bounding box east' })
  @ApiQuery({ name: 'west', required: false, type: Number, description: 'Bounding box west' })
  @ApiResponse({ status: 200, description: 'GeoJSON FeatureCollection for map display' })
  async mapData(@Query() filters: any) {
    const parsedFilters: SearchFilters = {
      city: filters.city,
      neighborhood: filters.neighborhood,
      transactionType: filters.transactionType,
      propertyType: filters.propertyType,
      priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
      rooms: filters.rooms ? Number(filters.rooms) : undefined,
      bedroomsMin: filters.bedroomsMin ? Number(filters.bedroomsMin) : undefined,
      bedroomsMax: filters.bedroomsMax ? Number(filters.bedroomsMax) : undefined,
    };

    // Parse bounding box if provided
    if (filters.north && filters.south && filters.east && filters.west) {
      parsedFilters.bounds = {
        north: Number(filters.north),
        south: Number(filters.south),
        east: Number(filters.east),
        west: Number(filters.west),
      };
    }

    return this.searchService.getMapData(parsedFilters);
  }

  @Public()
  @Get('facets')
  @ApiOperation({ summary: 'Get Search Facets/Aggregations' })
  @ApiResponse({ 
    status: 200, 
    description: 'Aggregated data for building filter UI (cities, price ranges, room counts)' 
  })
  async facets() {
    return this.searchService.getFacets();
  }
}
