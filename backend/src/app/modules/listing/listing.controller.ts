/**
 * 🏠 LISTING CONTROLLER - Conform ADR-001: Model de Cont Unificat
 *
 * Folosește VerificationGuard pentru a controla accesul:
 * - Căutare/vizualizare: Public (level 0)
 * - Creare/editare/ștergere: Necesită level 2+ (identitate verificată)
 *
 * Endpoints:
 * - GET /properties - List/search properties (public)
 * - GET /properties/:id - Get property details (public)
 * - POST /properties - Create property (requires level 2)
 * - PATCH /properties/:id - Update property (requires level 2 + owner)
 * - DELETE /properties/:id - Delete property (requires level 2 + owner)
 * - GET /properties/me/all - Get my properties (requires level 2)
 * - POST /properties/:id/photos - Upload photos (requires level 2 + owner)
 * - PATCH /properties/:id/status - Update status (requires level 2 + owner)
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
  UploadedFiles,
  UseInterceptors,
  UseGuards,
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
  // PUBLIC ENDPOINTS (no auth required)
  // ============================================================================

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
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRooms') minRooms?: string,
    @Query('maxRooms') maxRooms?: string,
    @Query('minSurface') minSurface?: string,
    @Query('maxSurface') maxSurface?: string,
    @Query('isFurnished') isFurnished?: string,
    @Query('hasCentralHeating') hasCentralHeating?: string,
    @Query('isAgency') isAgency?: string,
    @Query('sortBy') sortBy?: 'price' | 'createdAt' | 'postedAt',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const parsedLimit = limit ? Number(limit) : 20;
    const parsedPage = page ? Number(page) : 1;
    const parsedOffset = offset ? Number(offset) : (parsedPage - 1) * parsedLimit;

    // Note: transactionType and propertyType will be added to service when Listing entity is updated
    return this.listingService.findAll({
      limit: parsedLimit,
      offset: parsedOffset,
      city,
      neighborhood,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRooms: minRooms ? Number(minRooms) : undefined,
      maxRooms: maxRooms ? Number(maxRooms) : undefined,
      minSurface: minSurface ? Number(minSurface) : undefined,
      maxSurface: maxSurface ? Number(maxSurface) : undefined,
      isFurnished: isFurnished ? isFurnished === 'true' : undefined,
      hasCentralHeating: hasCentralHeating ? hasCentralHeating === 'true' : undefined,
      isAgency: isAgency ? isAgency === 'true' : undefined,
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
    // Track view asynchronously
    this.analyticsService
      .trackView(Number(id), user?.id)
      .catch((err) => console.error('View tracking failed', err));

    return this.listingService.findOne(+id);
  }

  // ============================================================================
  // AUTHENTICATED ENDPOINTS - Require Level 2 (Identity Verified)
  // ============================================================================

  /**
   * Get my properties
   * ADR-001: Requires level 2+ to see "my listings"
   * (Users without level 2 can't post, so they have no listings)
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(2)
  @Get('me/all')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my properties',
    description: 'Requires identity verification (level 2)',
  })
  @ApiForbiddenResponse({ description: 'Identity verification required' })
  async findMyProperties(@CurrentUserId() userId: number) {
    return this.listingService.findMyListings(userId);
  }

  /**
   * Create new property
   * ADR-001: Requires level 2+ (identity verified)
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(2)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new property',
    description: 'Requires identity verification (level 2). This is the core of ADR-001.',
  })
  @ApiResponse({ status: 201, description: 'Property created' })
  @ApiForbiddenResponse({
    description: 'Identity verification required to post listings',
  })
  async create(@CurrentUserId() userId: number, @Body() dto: CreateListingDto) {
    return this.listingService.create(userId, dto);
  }

  /**
   * Update property
   * ADR-001: Requires level 2+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(2)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update property',
    description: 'Requires identity verification and ownership',
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
   * ADR-001: Requires level 2+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(2)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete property',
    description: 'Requires identity verification and ownership',
  })
  @ApiResponse({ status: 200, description: 'Property deleted' })
  @ApiForbiddenResponse({ description: 'Not owner or not verified' })
  async remove(@Param('id') id: string, @CurrentUserId() userId: number) {
    await this.listingService.remove(id, userId);
    return { success: true, message: 'Proprietate ștearsă' };
  }

  /**
   * Upload property photos
   * ADR-001: Requires level 2+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(2)
  @Post(':id/photos')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photos', maxCount: 20 }]),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload property photos',
    description: 'Requires identity verification and ownership',
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
   * ADR-001: Requires level 2+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(2)
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update property status',
    description: 'Requires identity verification and ownership',
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
   * ADR-001: Requires level 2+ and must be owner
   */
  @UseGuards(AuthGuard, VerificationGuard)
  @MinVerificationLevel(2)
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
    return this.analyticsService.getPropertyAnalytics(Number(id), period);
  }
}
