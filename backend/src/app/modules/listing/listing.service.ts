// src/listing/listing.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CreateListingDto, UpdateListingDto } from './listing.dto.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { ListingImage } from '../../db/entities/listingImage.entity.js';
import { S3Service } from '../../s3/s3.service.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class ListingService {
  private readonly logger = new Logger(ListingService.name);

  constructor(private readonly s3Service: S3Service) {}

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
    const { Op } = require('sequelize');

    if (city) where.city = city;
    if (neighborhood) where.neighborhood = neighborhood;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceEur = {};
      if (minPrice !== undefined) where.priceEur[Op.gte] = minPrice;
      if (maxPrice !== undefined) where.priceEur[Op.lte] = maxPrice;
    }

    if (minRooms !== undefined || maxRooms !== undefined) {
      where.rooms = {};
      if (minRooms !== undefined) where.rooms[Op.gte] = minRooms;
      if (maxRooms !== undefined) where.rooms[Op.lte] = maxRooms;
    }

    if (minSurface !== undefined || maxSurface !== undefined) {
      where.surfaceSqm = {};
      if (minSurface !== undefined) where.surfaceSqm[Op.gte] = minSurface;
      if (maxSurface !== undefined) where.surfaceSqm[Op.lte] = maxSurface;
    }

    if (isFurnished !== undefined) where.isFurnished = isFurnished;
    if (hasCentralHeating !== undefined) where.hasCentralHeating = hasCentralHeating;
    if (isAgency !== undefined) where.isAgency = isAgency;

    // Map 'price' to 'priceEur' for sorting
    const sortColumnMap: Record<string, string> = {
      price: 'priceEur',
      createdAt: 'createdAt',
      postedAt: 'postedAt',
    };
    const orderColumn = sortColumnMap[sortBy] || 'createdAt';
    const orderDirection = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';

    const { rows, count } = await Listing.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderColumn, orderDirection]],
      include: [{ model: ListingImage, as: 'images' }],
    });

    return { items: rows, total: count };
  }

  async findOne(id: number | string): Promise<Listing> {
    const listing = await Listing.findByPk(id, {
      include: [{ model: ListingImage, as: 'images' }],
    });
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
      include: [{ model: ListingImage, as: 'images' }],
    });
  }

  /**
   * Upload photos to S3 and save to ListingImage
   */
  async uploadPhotos(id: string, ownerId: number | string, files: Express.Multer.File[]) {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');
    if (String(listing.ownerId) !== String(ownerId)) throw new ForbiddenException('Not owner');

    if (!files || files.length === 0) {
      return { uploaded: [], message: 'No files provided' };
    }

    const uploadedImages: { id: number; url: string; isPrimary: boolean }[] = [];

    // Check if listing already has images
    const existingImages = await ListingImage.count({ where: { listingId: Number(id) } });
    const isFirstImage = existingImages === 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Save buffer to temp file for S3 upload
        const tempPath = path.join(os.tmpdir(), `${Date.now()}_${file.originalname}`);
        fs.writeFileSync(tempPath, file.buffer);

        // Upload to S3
        const s3Key = `listings/${id}/${Date.now()}_${i}_${file.originalname}`;
        await this.s3Service.uploadImage(tempPath, s3Key);

        // Construct S3 URL
        const bucket = process.env.AWS_S3_BUCKET || 'domaris-uploads';
        const url = `https://${bucket}.s3.eu-central-1.amazonaws.com/${s3Key}`;

        // Clean up temp file
        fs.unlinkSync(tempPath);

        // Save to database
        const image = await ListingImage.create({
          listingId: Number(id),
          url,
          isPrimary: isFirstImage && i === 0, // First image is primary
          alt: listing.title,
        });

        uploadedImages.push({
          id: image.id,
          url: image.url,
          isPrimary: image.isPrimary,
        });

        this.logger.log(`Uploaded image ${i + 1}/${files.length} for listing ${id}`);
      } catch (error: any) {
        this.logger.error(`Failed to upload image ${i + 1}: ${error.message}`);
        // Continue with other images even if one fails
      }
    }

    return {
      uploaded: uploadedImages,
      total: uploadedImages.length,
      message: `Successfully uploaded ${uploadedImages.length} of ${files.length} images`,
    };
  }

  async updateStatus(id: string, ownerId: number | string, status: string) {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');
    if (String(listing.ownerId) !== String(ownerId)) throw new ForbiddenException('Not owner');

    // Validate status
    const validStatuses = ['new', 'early_access', 'public', 'rented', 'hidden', 'expired'];
    if (!validStatuses.includes(status)) {
      throw new NotFoundException(`Invalid status. Valid: ${validStatuses.join(', ')}`);
    }

    await listing.update({ status: status as any });
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

    // Delete associated images from DB (S3 cleanup could be added separately)
    await ListingImage.destroy({ where: { listingId: Number(id) } });

    await listing.destroy();
  }
}

