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
  async findAll(params: {
    limit?: number;
    offset?: number;
    city?: string;
    area?: string;
  }) {
    const { limit = 20, offset = 0, city, area } = params;

    const where: any = {};
    if (city) where.city = city;
    if (area) where.area = area;

    const { rows, count } = await Listing.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
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
