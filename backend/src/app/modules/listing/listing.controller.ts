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
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateListingDto, UpdateListingDto } from './listing.dto.js';
import { AuthOnly, Public, CurrentUser } from '../../core/decorators.js';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('properties')
@Controller('properties')
export class ListingController {
  constructor(
    private readonly listingService: ListingService,
    private readonly analyticsService: AnalyticsService
  ) { }

  /**
   * Public: listare anunțuri cu pagination simplă și filtre
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Search properties with filters' })
  @ApiResponse({ status: 200, description: 'Return all listings.' })
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('city') city?: string,
    @Query('neighborhood') neighborhood?: string,
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
    const parsedLimit = limit ? Number(limit) : undefined;
    const parsedOffset = offset ? Number(offset) : undefined;

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

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get property details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: any
  ) {
    // Track view asynchronously
    this.analyticsService.trackView(Number(id), user?.id).catch(err => console.error('View tracking failed', err));

    return this.listingService.findOne(+id);
  }

  @AuthOnly()
  @Post()
  @ApiOperation({ summary: 'Create new property' })
  async create(@CurrentUser() user: any, @Body() dto: CreateListingDto) {
    return this.listingService.create(user.id, dto);
  }

  @AuthOnly()
  @Patch(':id')
  @ApiOperation({ summary: 'Update property details' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateListingDto
  ) {
    return this.listingService.update(id, user.id, dto);
  }

  @AuthOnly()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete property' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.listingService.remove(id, user.id);
    return { success: true };
  }

  // --- New Endpoints for Module 03 ---

  @AuthOnly()
  @Get('me/all') // 'me/all' to avoid conflict with ':id' if not careful, but 'me' is not an int ID so it's safer generally, but explicit is better or move above :id
  @ApiOperation({ summary: 'Get my properties' })
  async findMyProperties(@CurrentUser() user: any) {
    return this.listingService.findMyListings(user.id);
  }

  @AuthOnly()
  @Post(':id/photos')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photos', maxCount: 10 },
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload property photos' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: { type: 'array', items: { type: 'string', format: 'binary' } },
      }
    }
  })
  async uploadPhotos(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFiles() files: { photos?: Express.Multer.File[] }
  ) {
    return this.listingService.uploadPhotos(id, user.id, files.photos || []);
  }

  @AuthOnly()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update property status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: string
  ) {
    return this.listingService.updateStatus(id, user.id, status);
  }
}
