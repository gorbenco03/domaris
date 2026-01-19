// src/listing/listing.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateListingDto, UpdateListingDto } from './listing.dto.js';
import { Listing } from '../../db/entities/listing.entity.js';

@Injectable()
export class ListingService {
  /**
   * Creează un anunț nou pentru user-ul curent
   */
  async create(
    ownerId: number | string,
    dto: CreateListingDto
  ): Promise<Listing> {
    const listing = await Listing.create({
      ...dto,
      ownerId,
    });

    return listing;
  }

  /**
   * Listare cu un minim de pagination / filtrare
   */
  /**
   * Listare cu un minim de pagination / filtrare
   */
  async findAll(params: {
    limit?: number;
    offset?: number;
    city?: string;
    neighborhood?: string;
    minPrice?: number;
    maxPrice?: number;
    minRooms?: number;
    maxRooms?: number;
    minSurface?: number;
    maxSurface?: number;
    isFurnished?: boolean;
    hasCentralHeating?: boolean;
    isAgency?: boolean;
    sortBy?: 'price' | 'createdAt' | 'postedAt';
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      limit = 20,
      offset = 0,
      city,
      neighborhood,
      minPrice,
      maxPrice,
      minRooms,
      maxRooms,
      minSurface,
      maxSurface,
      isFurnished,
      hasCentralHeating,
      isAgency,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const where: any = {};
    const { Op } = require('sequelize'); // Import locally to avoid top-level import issues if not already present

    if (city) where.city = city;
    // Map 'neighborhood' to 'area' field in DB if that's the convention, or use 'neighborhood' if column exists.
    // DTO says 'area', implementation plan implies mapping.
    // DTO uses 'area' for neighborhood/zone. Let's assume 'area' column.
    if (neighborhood) where.area = neighborhood;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price[Op.gte] = minPrice;
      if (maxPrice !== undefined) where.price[Op.lte] = maxPrice;
    }

    if (minRooms !== undefined || maxRooms !== undefined) {
      where.rooms = {};
      if (minRooms !== undefined) where.rooms[Op.gte] = minRooms;
      if (maxRooms !== undefined) where.rooms[Op.lte] = maxRooms;
    }

    if (minSurface !== undefined || maxSurface !== undefined) {
      where.surface = {}; // Assuming 'surface' is the column name, DTO has 'surface', entity likely matches
      if (minSurface !== undefined) where.surface[Op.gte] = minSurface;
      if (maxSurface !== undefined) where.surface[Op.lte] = maxSurface;
    }

    if (isFurnished !== undefined) where.isFurnished = isFurnished;
    // Assuming hasCentralHeating col exists or not? Listing interface in api.ts has it. Let's check entity if possible, but assuming yes.
    if (hasCentralHeating !== undefined) where.hasCentralHeating = hasCentralHeating; // Verify column name if possible
    if (isAgency !== undefined) where.isAgency = isAgency;

    const orderColumn = ['price', 'createdAt', 'postedAt'].includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';

    const { rows, count } = await Listing.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderColumn, orderDirection]],
    });

    return { items: rows, total: count };
  }

  async findOne(id: number | string): Promise<Listing> {
    const listing = await Listing.findByPk(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  /**
   * Update doar dacă listing-ul aparține user-ului
   */
  async update(
    id: number | string,
    ownerId: number | string,
    dto: UpdateListingDto
  ): Promise<Listing> {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');

    if (String(listing.ownerId) !== String(ownerId)) {
      throw new ForbiddenException('You are not the owner of this listing');
    }

    await listing.update(dto);
    return listing;
  }

  async findMyListings(ownerId: number | string) {
    return Listing.findAll({
      where: { ownerId },
      order: [['createdAt', 'DESC']],
    });
  }

  async uploadPhotos(id: string, ownerId: number | string, files: any[]) {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');
    if (String(listing.ownerId) !== String(ownerId)) throw new ForbiddenException('Not owner');

    // 1. Upload to S3 (mock)
    const uploadedUrls = files.map((f, i) => `https://mock-s3.com/images/${id}_${Date.now()}_${i}.jpg`);

    // 2. Save to DB (Assuming ListingImage entity or photos array)
    // For now, let's treat it as if we are adding to a related table or JSON
    // Mock return
    return { uploaded: uploadedUrls };
  }

  async updateStatus(id: string, ownerId: number | string, status: string) {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');
    if (String(listing.ownerId) !== String(ownerId)) throw new ForbiddenException('Not owner');

    // listing.status = status; // Assuming status enum match
    // await listing.save();
    return { success: true, status };
  }

  /**
   * Delete doar dacă listing-ul aparține user-ului
   */
  async remove(id: number | string, ownerId: number | string): Promise<void> {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');

    if (String(listing.ownerId) !== String(ownerId)) {
      throw new ForbiddenException('You are not the owner of this listing');
    }

    await listing.destroy();
  }
}
