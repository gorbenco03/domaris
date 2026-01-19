// src/listing/listing.controller.ts
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
} from '@nestjs/common';
import { ListingService } from './listing.service.js';
import { CreateListingDto, UpdateListingDto } from './listing.dto.js';
import { AuthOnly, Public } from '../../core/decorators.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('listings')
@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) { }

  /**
   * Public: listare anunțuri cu pagination simplă și filtre
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Public: listare anunțuri cu pagination simplă și filtre' })
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

  /**
   * Public: un singur anunț
   */
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.listingService.findOne(id);
  }

  /**
   * Creat anunț nou (Public temporar pentru testare frontend)
   */
  @Public()
  @Post()
  async create(@Req() req: any, @Body() dto: CreateListingDto) {
    // Hardcode user ID for testing since auth is disabled
    const userId = req.user?.sub || 1;
    return this.listingService.create(userId, dto);
  }

  /**
   * Update anunț (doar owner)
   */
  @AuthOnly()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateListingDto
  ) {
    const userId = req.user?.sub;
    return this.listingService.update(id, userId, dto);
  }

  /**
   * Delete anunț (doar owner)
   */
  @AuthOnly()
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub;
    await this.listingService.remove(id, userId);
    return { success: true };
  }
}
