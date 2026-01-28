/**
 * 🏠 LISTING CONTROLLER - Conform ADR-001: Model de Cont Unificat
 *
 * Folosește VerificationGuard pentru a controla accesul:
 * - Căutare/vizualizare: Public (level 0)
 * - Creare/editare/ștergere: Necesită level 3+ (proprietar verificat)
 *
 * Endpoints:
 * - GET /properties - List/search properties (public)
 * - GET /properties/:id - Get property details (public)
 * - POST /properties - Create property (requires level 3)
 * - PATCH /properties/:id - Update property (requires level 3 + owner)
 * - DELETE /properties/:id - Delete property (requires level 3 + owner)
 * - GET /properties/me/all - Get my properties (requires level 3)
 * - POST /properties/:id/photos - Upload photos (requires level 3 + owner)
 * - PATCH /properties/:id/status - Update status (requires level 3 + owner)
 */

import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ListingService } from './listing.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateListingDto, UpdateListingDto } from './listing.dto.js';
import {
  Public,
  CurrentUser,
  CurrentUserId,
  MinVerificationLevel,
} from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';
import { VerificationGuard } from '../../core/verification.guard';

@ApiTags('properties')
@Controller('properties')
export class ListingController {
  constructor(
    private readonly listingService: ListingService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ============================================================================
  // AUTHENTICATED ENDPOINTS (MOVED UP to avoid conflict with /:id)
  // ============================================================================

  /**
   * Get my properties
   * ADR-001: Requires level 3+ to see "my listings"
   * (Users without level 3 can't post, so they have no listings)
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my properties',
    description: 'Requires ownership verification (level 3)',
  })
  @ApiForbiddenResponse({ description: 'Identity verification required' })
  async findMyProperties(@CurrentUserId() userId: number) {
    return this.listingService.findMyListings(userId);
  }

  // ============================================================================
  // PUBLIC ENDPOINTS (no auth required)
  // ============================================================================

  /**
   * Map search - get properties in bounding box
   * Public endpoint for map view
   */
  @Public()
  @Get('map-search')
  @ApiOperation({
    summary: 'Search properties by map bounds',
    description: 'Returns properties within visible map area (bounding box). Public endpoint.',
  })
  @ApiResponse({ status: 200, description: 'Properties in bounds' })
  async findInBounds(
    @Query('neLat') neLat: string,
    @Query('neLng') neLng: string,
    @Query('swLat') swLat: string,
    @Query('swLng') swLng: string,
    @Query('limit') limit?: string,
    @Query('transactionType') transactionType?: string,
    @Query('propertyType') propertyType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRooms') minRooms?: string,
    @Query('maxRooms') maxRooms?: string,
  ) {
    return this.listingService.findInBounds({
      neLat: parseFloat(neLat),
      neLng: parseFloat(neLng),
      swLat: parseFloat(swLat),
      swLng: parseFloat(swLng),
      limit: limit ? parseInt(limit) : undefined,
      transactionType,
      propertyType,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRooms: minRooms ? parseInt(minRooms) : undefined,
      maxRooms: maxRooms ? parseInt(maxRooms) : undefined,
    });
  }

  /**
   * Search/list properties - public access
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Search properties with filters',
    description: 'Public endpoint - no authentication required',
  })
  @ApiResponse({ status: 200, description: 'Return filtered listings' })
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('page') page?: string,
    @Query('city') city?: string,
    @Query('neighborhood') neighborhood?: string,
    @Query('transactionType') transactionType?: string,
    @Query('propertyType') propertyType?: string,
    @Query('minBedrooms') minBedrooms?: string,
    @Query('maxBedrooms') maxBedrooms?: string,
    @Query('minBathrooms') minBathrooms?: string,
    @Query('maxBathrooms') maxBathrooms?: string,
    @Query('minFloor') minFloor?: string,
    @Query('maxFloor') maxFloor?: string,
    @Query('minYearBuilt') minYearBuilt?: string,
    @Query('maxYearBuilt') maxYearBuilt?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRooms') minRooms?: string,
    @Query('maxRooms') maxRooms?: string,
    @Query('minSurface') minSurface?: string,
    @Query('maxSurface') maxSurface?: string,
    @Query('isFurnished') isFurnished?: string,
    @Query('hasCentralHeating') hasCentralHeating?: string,
    @Query('isAgency') isAgency?: string,
    @Query('petFriendly') petFriendly?: string,
    @Query('amenities') amenities?: string | string[],
    @Query('sortBy') sortBy?: 'price' | 'createdAt' | 'postedAt',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const parsedLimit = limit ? Number(limit) : 20;
    const parsedPage = page ? Number(page) : 1;
    const parsedOffset = offset ? Number(offset) : (parsedPage - 1) * parsedLimit;

    const amenitiesList = Array.isArray(amenities)
      ? amenities
      : amenities
      ? amenities.split(',').map((item) => item.trim()).filter(Boolean)
      : undefined;

    return this.listingService.findAll({
      limit: parsedLimit,
      offset: parsedOffset,
      city,
      neighborhood,
      transactionType,
      propertyType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRooms: minRooms ? Number(minRooms) : undefined,
      maxRooms: maxRooms ? Number(maxRooms) : undefined,
      minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
      maxBedrooms: maxBedrooms ? Number(maxBedrooms) : undefined,
      minBathrooms: minBathrooms ? Number(minBathrooms) : undefined,
      maxBathrooms: maxBathrooms ? Number(maxBathrooms) : undefined,
      minFloor: minFloor ? Number(minFloor) : undefined,
      maxFloor: maxFloor ? Number(maxFloor) : undefined,
      minYearBuilt: minYearBuilt ? Number(minYearBuilt) : undefined,
      maxYearBuilt: maxYearBuilt ? Number(maxYearBuilt) : undefined,
      minSurface: minSurface ? Number(minSurface) : undefined,
      maxSurface: maxSurface ? Number(maxSurface) : undefined,
      isFurnished: isFurnished ? isFurnished === 'true' : undefined,
      hasCentralHeating: hasCentralHeating ? hasCentralHeating === 'true' : undefined,
      isAgency: isAgency ? isAgency === 'true' : undefined,
      petFriendly: petFriendly ? petFriendly === 'true' : undefined,
      amenities: amenitiesList,
      sortBy,
      sortOrder,
    });
  }

  /**
   * Get property details - public access
   */
  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get property details',
    description: 'Public endpoint - no authentication required',
  })
  @ApiResponse({ status: 200, description: 'Property details' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid property ID');
    }

    return this.listingService.findOne(numericId);
  }

  /**
   * Track property view (public)
   */
  @Public()
  @Post(':id/view')
  @ApiOperation({
    summary: 'Track property view',
    description: 'Public endpoint - counts view after client-side delay',
  })
  @ApiResponse({ status: 200, description: 'View tracked' })
  async trackView(@Param('id') id: string, @Req() req: any, @CurrentUser() user?: any) {
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid property ID');
    }

    const forwardedFor = req?.headers?.['x-forwarded-for'];
    const ip =
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split?.(',')?.[0]?.trim?.() ||
      req?.ip;
    const anonymousHeader = req?.headers?.['x-anonymous-id'];
    const anonymousId = Array.isArray(anonymousHeader) ? anonymousHeader[0] : anonymousHeader;

    await this.analyticsService.trackView(numericId, user?.id, anonymousId, ip);

    return { success: true };
  }

  // ============================================================================
  // AUTHENTICATED ENDPOINTS - Require Level 2 (Identity Verified)
  // ============================================================================

  /**
   * Create new property
   * ADR-001: Requires level 3+ (ownership verified)
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new property',
    description: 'Requires ownership verification (level 3).',
  })
  @ApiResponse({ status: 201, description: 'Property created' })
  @ApiForbiddenResponse({
    description: 'Ownership verification required to post listings',
  })
  async create(@CurrentUserId() userId: number, @Body() dto: CreateListingDto) {
    return this.listingService.create(userId, dto);
  }

  /**
   * Update property
   * ADR-001: Requires level 3+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update property',
    description: 'Requires ownership verification and ownership',
  })
  @ApiResponse({ status: 200, description: 'Property updated' })
  @ApiForbiddenResponse({ description: 'Not owner or not verified' })
  async update(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingService.update(id, userId, dto);
  }

  /**
   * Delete property
   * ADR-001: Requires level 3+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete property',
    description: 'Requires ownership verification and ownership',
  })
  @ApiResponse({ status: 200, description: 'Property deleted' })
  @ApiForbiddenResponse({ description: 'Not owner or not verified' })
  async remove(@Param('id') id: string, @CurrentUserId() userId: number) {
    await this.listingService.remove(id, userId);
    return { success: true, message: 'Proprietate ștearsă' };
  }

  /**
   * Upload property photos
   * ADR-001: Requires level 3+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Post(':id/photos')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photos', maxCount: 20 }]),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload property photos',
    description: 'Requires ownership verification and ownership',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: 20,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Photos uploaded' })
  async uploadPhotos(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
    @UploadedFiles() files: { photos?: Express.Multer.File[] },
  ) {
    return this.listingService.uploadPhotos(id, userId, files.photos || []);
  }

  /**
   * Update property status
   * ADR-001: Requires level 3+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update property status',
    description: 'Requires ownership verification and ownership',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['DRAFT', 'ACTIVE', 'RENTED', 'SOLD', 'HIDDEN'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
    @Body('status') status: string,
  ) {
    return this.listingService.updateStatus(id, userId, status);
  }

  // ============================================================================
  // PROPERTY ANALYTICS (for owners)
  // ============================================================================

  /**
   * Get property analytics
   * ADR-001: Requires level 3+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(3)
  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get property analytics',
    description: 'View statistics for your property (views, favorites, inquiries)',
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(
    @Param('id') id: string,
    @Query('period') period: '7d' | '30d' | 'all' = '30d',
  ) {
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid property ID');
    }

    return this.analyticsService.getPropertyAnalytics(numericId, period);
  }
}
