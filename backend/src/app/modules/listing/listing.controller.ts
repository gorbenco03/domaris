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

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  /**
   * Public: listare anunțuri cu pagination simplă
   */
  @Public()
  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('city') city?: string,
    @Query('area') area?: string
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    const parsedOffset = offset ? Number(offset) : undefined;

    return this.listingService.findAll({
      limit: parsedLimit,
      offset: parsedOffset,
      city,
      area,
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
   * Creat anunț nou (user logat; sar peste subscription check prin @AuthOnly)
   */
  @AuthOnly()
  @Post()
  async create(@Req() req: any, @Body() dto: CreateListingDto) {
    const userId = req.user?.sub; // setat de AuthGuard prin payloadJwt.payload.sub
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
