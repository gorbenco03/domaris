/**
 * 🏠 LISTING CONTROLLER
 *
 * All listing operations require only authentication.
 * Ownership verification is per-listing (document upload + admin review).
 * Listings are visible publicly but get a "verified" badge only after admin approval.
 *
 * Endpoints:
 * - GET /properties - List/search properties (public)
 * - GET /properties/:id - Get property details (public)
 * - POST /properties - Create property (requires auth)
 * - PATCH /properties/:id - Update property (requires auth + owner)
 * - DELETE /properties/:id - Delete property (requires auth + owner)
 * - GET /properties/my - Get my properties (requires auth)
 * - POST /properties/:id/photos - Upload photos (requires auth + owner)
 * - PATCH /properties/:id/status - Update status (requires auth + owner)
 * - POST /properties/:id/ownership-doc - Upload ownership document (requires auth + owner)
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
  ForbiddenException,
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
import { BadRequestException } from '@nestjs/common';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_DOC_MIMES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOC_SIZE = 20 * 1024 * 1024;   // 20 MB

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: Function) => {
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_IMAGE_MIMES.join(', ')}`), false);
  }
  cb(null, true);
};

const docFileFilter = (_req: any, file: Express.Multer.File, cb: Function) => {
  if (!ALLOWED_DOC_MIMES.includes(file.mimetype)) {
    return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_DOC_MIMES.join(', ')}`), false);
  }
  cb(null, true);
};
import { ListingService } from './listing.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateListingDto, UpdateListingDto } from './listing.dto.js';
import {
  Public,
  CurrentUser,
  CurrentUserId,
} from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';

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
   */
  @UseGuards(AuthGuard)
  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my properties',
    description: 'Requires authentication',
  })
  async findMyProperties(@CurrentUserId() userId: number) {
    return this.listingService.findMyListings(userId);
  }

  // ============================================================================
  // PUBLIC ENDPOINTS (no auth required)
  // ============================================================================

  /**
   * Map search - get properties in bounding box
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
    @CurrentUser() user?: any,
  ) {
    return this.listingService.findInBounds({
      neLat: parseFloat(neLat),
      neLng: parseFloat(neLng),
      swLat: parseFloat(swLat),
      swLng: parseFloat(swLng),
      viewerUserId: user?.id,
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
    @CurrentUser() user?: any,
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
      viewerUserId: user?.id,
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

    return this.listingService.findOnePublic(numericId, user?.id);
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

    // Respect listing visibility (public / eligible early access)
    await this.listingService.findOnePublic(numericId, user?.id);

    await this.analyticsService.trackView(numericId, user?.id, anonymousId, ip);

    return { success: true };
  }

  // ============================================================================
  // AUTHENTICATED ENDPOINTS (auth only, no verification level required)
  // ============================================================================

  /**
   * Create new property
   */
  @UseGuards(AuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new property',
    description: 'Requires authentication. Listings are public but get a "verified" badge only after admin reviews ownership document.',
  })
  @ApiResponse({ status: 201, description: 'Property created' })
  async create(@CurrentUserId() userId: number, @Body() dto: CreateListingDto) {
    return this.listingService.create(userId, dto);
  }

  /**
   * Update property (must be owner)
   */
  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update property',
    description: 'Requires authentication and ownership',
  })
  @ApiResponse({ status: 200, description: 'Property updated' })
  @ApiForbiddenResponse({ description: 'Not owner' })
  async update(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingService.update(id, userId, dto);
  }

  /**
   * Delete property (must be owner)
   */
  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete property',
    description: 'Requires authentication and ownership',
  })
  @ApiResponse({ status: 200, description: 'Property deleted' })
  @ApiForbiddenResponse({ description: 'Not owner' })
  async remove(@Param('id') id: string, @CurrentUserId() userId: number) {
    await this.listingService.remove(id, userId);
    return { success: true, message: 'Proprietate ștearsă' };
  }

  /**
   * Upload property photos (must be owner)
   */
  @UseGuards(AuthGuard)
  @Post(':id/photos')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'photos', maxCount: 20 }],
      { limits: { fileSize: MAX_IMAGE_SIZE }, fileFilter: imageFileFilter },
    ),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload property photos',
    description: 'Requires authentication and ownership',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: 50,
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
   * Upload ownership document for a listing (must be owner)
   * After upload, status becomes 'pending' and admin must review.
   */
  @UseGuards(AuthGuard)
  @Post(':id/ownership-doc')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'document', maxCount: 1 }],
      { limits: { fileSize: MAX_DOC_SIZE }, fileFilter: docFileFilter },
    ),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload ownership proof document for listing',
    description: 'Upload a document proving property ownership (deed, utility bill, etc). Admin will review and mark the listing as verified.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['docType', 'document'],
      properties: {
        docType: {
          type: 'string',
          enum: ['PROPERTY_DEED', 'UTILITY_BILL', 'RENTAL_CONTRACT', 'POWER_OF_ATTORNEY', 'OTHER'],
          description: 'Type of ownership document',
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF or image)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Document uploaded, pending review' })
  @ApiForbiddenResponse({ description: 'Not owner' })
  async uploadOwnershipDoc(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
    @UploadedFiles() files: { document?: Express.Multer.File[] },
    @Body('docType') docType: string,
  ) {
    return this.listingService.uploadOwnershipDoc(id, userId, files.document?.[0], docType);
  }

  /**
   * Update property status (must be owner)
   */
  @UseGuards(AuthGuard)
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update property status',
    description: 'Requires authentication and ownership',
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
   * Get property analytics (must be owner)
   */
  @UseGuards(AuthGuard)
  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get property analytics',
    description: 'View statistics for your property (views, favorites, inquiries)',
  })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  @ApiForbiddenResponse({ description: 'Not the owner of this property' })
  async getAnalytics(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
    @Query('period') period: '7d' | '30d' | 'all' = '30d',
  ) {
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid property ID');
    }

    // Verify ownership before returning analytics
    const listing = await this.listingService.findOne(numericId);
    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You can only view analytics for your own properties');
    }

    return this.analyticsService.getPropertyAnalytics(numericId, period);
  }
}
