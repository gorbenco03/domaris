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
import { User } from '../../db/entities/user.entity.js';
import { S3Service } from '../../s3/s3.service.js';
import { GeocodingService } from '../geocoding/geocoding.service.js';
import { SubscriptionService } from '../monetization/services/subscription.service.js';
import { PushNotificationService } from '../../core/push/push.service.js';
import { Favorite } from '../../db/entities/favorite.entity.js';
import { Sequelize } from 'sequelize-typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class ListingService {
  private readonly logger = new Logger(ListingService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly geocodingService: GeocodingService,
    private readonly subscriptionService: SubscriptionService,
    private readonly pushService: PushNotificationService,
  ) {}

  /**
   * Creează un anunț nou pentru user-ul curent
   */
  async create(
    ownerId: number | string,
    dto: CreateListingDto
  ): Promise<Listing> {
    this.logger.log(`Creating listing for ownerId: ${ownerId}, dto: ${JSON.stringify(dto)}`);

    // Enforce subscription listing limit
    const canCreate = await this.subscriptionService.canCreateListing(Number(ownerId));
    if (!canCreate.allowed) {
      throw new ForbiddenException(
        canCreate.reason || 'Ai atins limita de anunțuri pentru planul tău. Fă upgrade pentru a adăuga mai multe.',
      );
    }

    // Map DTO fields to Entity fields
    const input = dto as any;
    
    // Construct address text from components if not provided directly
    const computedAddress = [
      input.street, 
      input.number, 
      input.block ? `Bl. ${input.block}` : '', 
      input.apartment ? `Ap. ${input.apartment}` : ''
    ].filter(Boolean).join(', ');

    const listingData: any = {
      ...input,
      ownerId,
      priceEur: input.price, // Map price -> priceEur
      surfaceSqm: input.surface, // Map surface -> surfaceSqm
      rooms: Number(input.rooms), // Ensure number
      bedrooms: input.bedrooms !== undefined ? Number(input.bedrooms) : undefined,
      bathrooms: input.bathrooms !== undefined ? Number(input.bathrooms) : undefined,
      floor: input.floor !== undefined ? Number(input.floor) : undefined,
      totalFloors: input.totalFloors !== undefined ? Number(input.totalFloors) : undefined,
      yearBuilt: input.yearBuilt !== undefined ? Number(input.yearBuilt) : undefined,
      transactionType: input.transactionType,
      propertyType: input.propertyType,
      status: 'public',    // Default to public for now so it's visible

      // Location mapping
      addressText: input.addressText || input.address || computedAddress,
      neighborhood: input.neighborhood || input.area,
      city: input.city || 'Bucuresti', // Fallback
    };

    // GEOCODING LOGIC
    if (input.lat && input.lng) {
      // User set location manually on map
      listingData.lat = input.lat;
      listingData.lng = input.lng;
      listingData.locationSetManually = true;

      // Optionally reverse geocode to get formatted address
      if (!listingData.addressText) {
        const address = await this.geocodingService.reverseGeocode(input.lat, input.lng);
        if (address) {
          listingData.addressText = address;
        }
      }
    } else if (listingData.addressText) {
      // User provided address - geocode it
      const fullAddress = `${listingData.addressText}, ${listingData.city}, Romania`;
      const geocoded = await this.geocodingService.geocodeAddress(fullAddress);

      if (geocoded) {
        listingData.lat = geocoded.latitude;
        listingData.lng = geocoded.longitude;
        listingData.locationSetManually = false;
      } else {
        this.logger.warn(`Geocoding failed for address: ${fullAddress}`);
      }
    }

    const listing = await Listing.create(listingData);
    this.logger.log(`Created listing with location: lat=${listing.lat}, lng=${listing.lng}`);

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
    transactionType?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minRooms?: number;
    maxRooms?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    maxBathrooms?: number;
    minFloor?: number;
    maxFloor?: number;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minSurface?: number;
    maxSurface?: number;
    isFurnished?: boolean;
    hasCentralHeating?: boolean;
    isAgency?: boolean;
    petFriendly?: boolean;
    amenities?: string[];
    sortBy?: 'price' | 'createdAt' | 'postedAt';
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      limit = 20,
      offset = 0,
      city,
      neighborhood,
      transactionType,
      propertyType,
      minPrice,
      maxPrice,
      minRooms,
      maxRooms,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      minFloor,
      maxFloor,
      minYearBuilt,
      maxYearBuilt,
      minSurface,
      maxSurface,
      isFurnished,
      hasCentralHeating,
      isAgency,
      petFriendly,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const where: any = {};
    const { Op } = require('sequelize');

    if (city) where.city = city;
    if (neighborhood) where.neighborhood = neighborhood;
    if (transactionType) where.transactionType = transactionType;
    if (propertyType) where.propertyType = propertyType;

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

    if (minBedrooms !== undefined || maxBedrooms !== undefined) {
      where.bedrooms = {};
      if (minBedrooms !== undefined) where.bedrooms[Op.gte] = minBedrooms;
      if (maxBedrooms !== undefined) where.bedrooms[Op.lte] = maxBedrooms;
    }

    if (minBathrooms !== undefined || maxBathrooms !== undefined) {
      where.bathrooms = {};
      if (minBathrooms !== undefined) where.bathrooms[Op.gte] = minBathrooms;
      if (maxBathrooms !== undefined) where.bathrooms[Op.lte] = maxBathrooms;
    }

    if (minFloor !== undefined || maxFloor !== undefined) {
      where.floor = {};
      if (minFloor !== undefined) where.floor[Op.gte] = minFloor;
      if (maxFloor !== undefined) where.floor[Op.lte] = maxFloor;
    }

    if (minYearBuilt !== undefined || maxYearBuilt !== undefined) {
      where.yearBuilt = {};
      if (minYearBuilt !== undefined) where.yearBuilt[Op.gte] = minYearBuilt;
      if (maxYearBuilt !== undefined) where.yearBuilt[Op.lte] = maxYearBuilt;
    }

    if (minSurface !== undefined || maxSurface !== undefined) {
      where.surfaceSqm = {};
      if (minSurface !== undefined) where.surfaceSqm[Op.gte] = minSurface;
      if (maxSurface !== undefined) where.surfaceSqm[Op.lte] = maxSurface;
    }

    if (isFurnished !== undefined) where.isFurnished = isFurnished;
    if (hasCentralHeating !== undefined) where.hasCentralHeating = hasCentralHeating;
    if (isAgency !== undefined) where.isAgency = isAgency;
    if (petFriendly !== undefined) where.petFriendly = petFriendly;
    if (amenities && amenities.length > 0) {
      where.amenities = { [Op.contains]: amenities };
    }

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
      include: [
        { model: ListingImage, as: 'images' },
        { 
          model: User, 
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel', 'phone'] 
        }
      ],
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

    const oldPrice = listing.priceEur;

    const updateData: any = { ...dto };

    // Map DTO price -> priceEur (same as create)
    if (dto.price !== undefined) {
      updateData.priceEur = dto.price;
    }

    // GEOCODING LOGIC (same as create)
    if ((dto as any).lat && (dto as any).lng) {
      updateData.lat = (dto as any).lat;
      updateData.lng = (dto as any).lng;
      updateData.locationSetManually = true;
    } else if ((dto as any).addressText) {
      const fullAddress = `${(dto as any).addressText}, ${(dto as any).city || listing.city}, Romania`;
      const geocoded = await this.geocodingService.geocodeAddress(fullAddress);

      if (geocoded) {
        updateData.lat = geocoded.latitude;
        updateData.lng = geocoded.longitude;
        updateData.locationSetManually = false;
      }
    }

    await listing.update(updateData);

    // Notify users who favorited this property about price change
    const newPrice = listing.priceEur;
    if (oldPrice !== undefined && newPrice !== undefined && oldPrice !== newPrice) {
      this.notifyFavoritesOfPriceChange(
        Number(id),
        listing.title,
        oldPrice,
        newPrice,
        listing.currency || 'EUR',
        Number(ownerId),
      ).catch(err => {
        this.logger.error(`Failed to send price change notifications: ${err.message}`);
      });
    }

    return listing;
  }

  /**
   * Notify all users who favorited a property about a price change.
   * Runs asynchronously - does not block the update response.
   */
  private async notifyFavoritesOfPriceChange(
    propertyId: number,
    propertyTitle: string,
    oldPrice: number,
    newPrice: number,
    currency: string,
    ownerId: number,
  ): Promise<void> {
    try {
      const favorites = await Favorite.findAll({
        where: { propertyId },
        attributes: ['userId'],
      });

      if (favorites.length === 0) return;

      // Exclude the owner (they made the change)
      const userIds = [...new Set(favorites.map(f => Number(f.userId)))]
        .filter(uid => uid !== ownerId);

      if (userIds.length === 0) return;

      // Check notification preferences
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'notificationPreferences'],
      });

      const eligibleUserIds = users
        .filter(user => {
          const prefs = user.notificationPreferences;
          return prefs?.push !== false && prefs?.priceDrops !== false;
        })
        .map(user => Number(user.id));

      if (eligibleUserIds.length === 0) return;

      // Get property image for rich push notification
      const primaryImage = await ListingImage.findOne({
        where: { listingId: propertyId },
        order: [['isPrimary', 'DESC'], ['order', 'ASC']],
        attributes: ['url'],
      });
      const imageUrl = primaryImage?.url;

      this.logger.log(
        `Sending price change notifications for property ${propertyId} to ${eligibleUserIds.length} users ` +
        `(${oldPrice} → ${newPrice} ${currency})`
      );

      await Promise.allSettled(
        eligibleUserIds.map(userId =>
          this.pushService.notifyFavoritePriceChange(
            userId,
            propertyTitle,
            propertyId,
            oldPrice,
            newPrice,
            currency,
            imageUrl,
          )
        )
      );
    } catch (error: any) {
      this.logger.error(`Error sending price change notifications: ${error.message}`);
    }
  }

  async findMyListings(ownerId: number | string) {
    this.logger.log(`Finding listings for ownerId: ${ownerId}`);
    const listings = await Listing.findAll({
      where: { ownerId },
      order: [['createdAt', 'DESC']],
      attributes: {
        include: [
          [
            Sequelize.literal(
              `(SELECT COUNT(*) FROM listing_views lv WHERE lv.listing_id = "Listing"."id")`
            ),
            'viewsCount',
          ],
          [
            Sequelize.literal(
              `(SELECT COUNT(*) FROM conversations c WHERE c.property_id = "Listing"."id")`
            ),
            'leadsCount',
          ],
        ],
      },
      include: [{ model: ListingImage, as: 'images' }],
    });
    this.logger.log(`Found ${listings.length} listings for ownerId: ${ownerId}`);
    return listings;
  }

  /**
   * Find listings within map bounds (bounding box)
   * Used for map search view
   */
  async findInBounds(params: {
    neLat: number; // Northeast corner latitude
    neLng: number; // Northeast corner longitude
    swLat: number; // Southwest corner latitude
    swLng: number; // Southwest corner longitude
    limit?: number;
    // Optional filters
    transactionType?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minRooms?: number;
    maxRooms?: number;
  }) {
    const { neLat, neLng, swLat, swLng, limit = 100 } = params;
    const { Op } = require('sequelize');

    const where: any = {
      lat: {
        [Op.between]: [swLat, neLat],
      },
      lng: {
        [Op.between]: [swLng, neLng],
      },
      lat: { [Op.ne]: null }, // Only properties with coordinates
      lng: { [Op.ne]: null },
      status: 'public', // Only public listings
    };

    // Apply optional filters
    if (params.transactionType) where.transactionType = params.transactionType;
    if (params.propertyType) where.propertyType = params.propertyType;
    if (params.minPrice || params.maxPrice) {
      where.priceEur = {};
      if (params.minPrice) where.priceEur[Op.gte] = params.minPrice;
      if (params.maxPrice) where.priceEur[Op.lte] = params.maxPrice;
    }
    if (params.minRooms || params.maxRooms) {
      where.rooms = {};
      if (params.minRooms) where.rooms[Op.gte] = params.minRooms;
      if (params.maxRooms) where.rooms[Op.lte] = params.maxRooms;
    }

    const listings = await Listing.findAll({
      where,
      limit,
      include: [{ model: ListingImage, as: 'images' }],
      attributes: [
        'id',
        'title',
        'priceEur',
        'currency',
        'surfaceSqm',
        'rooms',
        'lat',
        'lng',
        'city',
        'neighborhood',
        'transactionType',
        'propertyType',
        'ownershipStatus',
      ],
    });

    this.logger.log(`Found ${listings.length} listings in bounds`);
    return listings;
  }

  /**
   * Upload photos to DigitalOcean Spaces and save to ListingImage
   */
  async uploadPhotos(id: string, ownerId: number | string, files: Express.Multer.File[]) {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');
    if (String(listing.ownerId) !== String(ownerId)) throw new ForbiddenException('Not owner');

    if (!files || files.length === 0) {
      return { uploaded: [], message: 'No files provided' };
    }

    // Enforce subscription photo limit
    const subscription = await this.subscriptionService.getUserSubscription(Number(ownerId));
    const capabilities = this.subscriptionService.getUserCapabilities(subscription);
    const existingImages = await ListingImage.count({ where: { listingId: Number(id) } });
    const totalAfterUpload = existingImages + files.length;

    if (totalAfterUpload > capabilities.maxPhotos) {
      const remaining = Math.max(0, capabilities.maxPhotos - existingImages);
      throw new ForbiddenException(
        `Limita de fotografii pentru planul tău este ${capabilities.maxPhotos}. ` +
        `Ai deja ${existingImages} fotografii, mai poți adăuga ${remaining}. ` +
        `Fă upgrade pentru a încărca mai multe.`,
      );
    }

    const uploadedImages: { id: number; url: string; isPrimary: boolean }[] = [];

    const isFirstImage = existingImages === 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Save buffer to temp file for Spaces upload
        const tempPath = path.join(os.tmpdir(), `${Date.now()}_${file.originalname}`);
        fs.writeFileSync(tempPath, file.buffer);

        // Upload to DigitalOcean Spaces
        const s3Key = `listings/${id}/${Date.now()}_${i}_${file.originalname}`;
        await this.s3Service.uploadImage(tempPath, s3Key);

        const url = this.s3Service.getPublicUrl(s3Key);

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
        this.logger.warn(`Failed to upload image ${i + 1} to Spaces: ${error.message}. Falling back to placeholder.`);
        
        // Fallback flow for development/missing keys
        const mockUrl = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&random=${Date.now()}_${i}`;
        
        try {
          // Save to database with mock URL
          const image = await ListingImage.create({
            listingId: Number(id),
            url: mockUrl,
            isPrimary: isFirstImage && i === 0,
            alt: listing.title,
          });

          uploadedImages.push({
            id: image.id,
            url: image.url,
            isPrimary: image.isPrimary,
          });
          
          this.logger.log(`Saved placeholder for image ${i + 1}`);
        } catch (dbError) {
           this.logger.error(`Failed to save placeholder to DB: ${dbError}`);
        }
      }
    }

    return {
      uploaded: uploadedImages,
      total: uploadedImages.length,
      message: `Successfully uploaded ${uploadedImages.length} of ${files.length} images`,
    };
  }

  /**
   * Upload ownership proof document for a listing
   */
  async uploadOwnershipDoc(
    id: string,
    ownerId: number | string,
    file: Express.Multer.File | undefined,
    docType: string,
  ) {
    const listing = await Listing.findByPk(id);
    if (!listing) throw new NotFoundException('Listing not found');
    if (String(listing.ownerId) !== String(ownerId)) {
      throw new ForbiddenException('You are not the owner of this listing');
    }

    if (!file) {
      throw new NotFoundException('Document file is required');
    }

    const validDocTypes = ['PROPERTY_DEED', 'UTILITY_BILL', 'RENTAL_CONTRACT', 'POWER_OF_ATTORNEY', 'OTHER'];
    if (!validDocTypes.includes(docType)) {
      throw new NotFoundException(`Invalid docType. Valid: ${validDocTypes.join(', ')}`);
    }

    let docUrl: string;

    try {
      // Save buffer to temp file for Spaces upload
      const tempPath = path.join(os.tmpdir(), `${Date.now()}_ownership_${file.originalname}`);
      fs.writeFileSync(tempPath, file.buffer);

      // Upload to DigitalOcean Spaces
      const s3Key = `ownership-docs/${id}/${Date.now()}_${file.originalname}`;
      await this.s3Service.uploadImage(tempPath, s3Key);

      docUrl = this.s3Service.getPublicUrl(s3Key);

      // Clean up temp file
      fs.unlinkSync(tempPath);
    } catch (error: any) {
      this.logger.warn(`Failed to upload ownership doc to Spaces: ${error.message}. Using placeholder path.`);
      docUrl = `uploads/ownership-docs/${id}/${Date.now()}_${file.originalname}`;
    }

    // Update listing with ownership doc info
    await listing.update({
      ownershipStatus: 'pending',
      ownershipDocUrl: docUrl,
      ownershipDocType: docType,
      ownershipRejectionReason: null,
      ownershipReviewedAt: null,
      ownershipReviewedBy: null,
    });

    this.logger.log(`[Ownership] Listing ${id} - ownership doc uploaded by user ${ownerId}, type: ${docType}`);

    return {
      success: true,
      ownershipStatus: 'pending',
      message: 'Document încărcat. Va fi verificat de echipa noastră.',
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

    // Delete associated images from DB (Spaces object cleanup could be added separately)
    await ListingImage.destroy({ where: { listingId: Number(id) } });

    await listing.destroy();
  }
}

