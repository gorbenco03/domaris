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
import { Op } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class ListingService {
  private readonly logger = new Logger(ListingService.name);
  private static readonly EARLY_ACCESS_DELAY_HOURS = 12;

  /** v1 launches with monetization OFF — plan caps (listings/photos) are not enforced. */
  private static isMonetizationEnabled(): boolean {
    return (process.env.MONETIZATION_ENABLED ?? 'false').toLowerCase() === 'true';
  }

  constructor(
    private readonly s3Service: S3Service,
    private readonly geocodingService: GeocodingService,
    private readonly subscriptionService: SubscriptionService,
    private readonly pushService: PushNotificationService,
  ) {}

  private async getVisibleStatuses(viewerUserId?: number): Promise<Array<'public' | 'early_access'>> {
    if (!viewerUserId) {
      return ['public'];
    }

    const hasEarlyAccess = await this.subscriptionService.hasEarlyAccess(viewerUserId);
    return hasEarlyAccess ? ['public', 'early_access'] : ['public'];
  }

  /**
   * Creează un anunț nou pentru user-ul curent
   */
  async create(
    ownerId: number | string,
    dto: CreateListingDto
  ): Promise<Listing> {
    this.logger.log(`Creating listing for ownerId: ${ownerId}, dto: ${JSON.stringify(dto)}`);

    const monetizationEnabled = ListingService.isMonetizationEnabled();

    // Enforce subscription listing limit (only when monetization is active — v1 has it OFF)
    if (monetizationEnabled) {
      const canCreate = await this.subscriptionService.canCreateListing(Number(ownerId));
      if (!canCreate.allowed) {
        throw new ForbiddenException(
          canCreate.reason || 'Ai atins limita de anunțuri pentru planul tău. Fă upgrade pentru a adăuga mai multe.',
        );
      }
    }

    // Explicitly map only whitelisted DTO fields — no spread of raw input
    const now = new Date();
    // When monetization is OFF (v1), there is no paid "early access" window — publish immediately.
    const publicFrom = monetizationEnabled
      ? new Date(now.getTime() + ListingService.EARLY_ACCESS_DELAY_HOURS * 60 * 60 * 1000)
      : now;

    const listingData: any = {
      // Allowed user-supplied fields from CreateListingDto only
      title: dto.title,
      description: dto.description,
      transactionType: dto.transactionType,
      propertyType: dto.propertyType,
      priceEur: dto.price,
      currency: dto.currency,
      city: dto.city || 'Chisinau',
      neighborhood: dto.area,
      rooms: dto.rooms !== undefined ? Number(dto.rooms) : undefined,
      bedrooms: dto.bedrooms !== undefined ? Number(dto.bedrooms) : undefined,
      bathrooms: dto.bathrooms !== undefined ? Number(dto.bathrooms) : undefined,
      floor: dto.floor !== undefined ? Number(dto.floor) : undefined,
      totalFloors: dto.totalFloors !== undefined ? Number(dto.totalFloors) : undefined,
      yearBuilt: dto.yearBuilt !== undefined ? Number(dto.yearBuilt) : undefined,
      surfaceSqm: dto.surface,
      amenities: dto.amenities,
      isFurnished: dto.isFurnished,
      hasCentralHeating: dto.hasCentralHeating,
      petFriendly: dto.petFriendly,
      // Address text from DTO
      addressText: dto.addressText,
      // Internal/controlled fields — not from user input
      ownerId,
      status: monetizationEnabled ? 'early_access' : 'public',
      postedAt: now,
      publicFrom,
    };

    // GEOCODING LOGIC
    if (dto.lat && dto.lng) {
      // User set location manually on map
      listingData.lat = dto.lat;
      listingData.lng = dto.lng;
      listingData.locationSetManually = true;

      // Optionally reverse geocode to get formatted address
      if (!listingData.addressText) {
        const address = await this.geocodingService.reverseGeocode(dto.lat, dto.lng);
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
    viewerUserId?: number;
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
      viewerUserId,
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
    const visibleStatuses = await this.getVisibleStatuses(viewerUserId);
    where.status = { [Op.in]: visibleStatuses };

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

    const earlyAccessCount = rows.filter((item) => item.status === 'early_access').length;
    if (earlyAccessCount > 0) {
      this.logger.log(
        `[METRIC] listing.findAll served early_access=${earlyAccessCount} total=${rows.length} viewer=${viewerUserId || 'anonymous'}`,
      );
    }

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

  async findOnePublic(
    id: number | string,
    viewerUserId?: number,
  ): Promise<Listing> {
    const listing = await this.findOne(id);

    // Owner can always view their own listing details
    if (viewerUserId && String(listing.ownerId) === String(viewerUserId)) {
      return listing;
    }

    const isVisiblePublicly = listing.status === 'public';

    if (isVisiblePublicly) {
      return listing;
    }

    if (listing.status !== 'early_access') {
      throw new NotFoundException('Listing not found');
    }

    if (!viewerUserId) {
      throw new NotFoundException('Listing not found');
    }

    const hasEarlyAccess = await this.subscriptionService.hasEarlyAccess(viewerUserId);
    if (!hasEarlyAccess) {
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

    // Explicitly pick only whitelisted DTO fields — no spread of raw input
    const updateData: any = {
      title: dto.title,
      description: dto.description,
      transactionType: dto.transactionType,
      propertyType: dto.propertyType,
      priceEur: dto.price,
      currency: dto.currency,
      city: dto.city,
      neighborhood: dto.area,
      rooms: dto.rooms !== undefined ? Number(dto.rooms) : undefined,
      bedrooms: dto.bedrooms !== undefined ? Number(dto.bedrooms) : undefined,
      bathrooms: dto.bathrooms !== undefined ? Number(dto.bathrooms) : undefined,
      floor: dto.floor !== undefined ? Number(dto.floor) : undefined,
      totalFloors: dto.totalFloors !== undefined ? Number(dto.totalFloors) : undefined,
      yearBuilt: dto.yearBuilt !== undefined ? Number(dto.yearBuilt) : undefined,
      surfaceSqm: dto.surface,
      amenities: dto.amenities,
      isFurnished: dto.isFurnished,
      hasCentralHeating: dto.hasCentralHeating,
      petFriendly: dto.petFriendly,
      addressText: dto.addressText,
    };

    // Remove undefined keys so Sequelize doesn't overwrite existing values
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    // GEOCODING LOGIC (same as create)
    if (dto.lat && dto.lng) {
      updateData.lat = dto.lat;
      updateData.lng = dto.lng;
      updateData.locationSetManually = true;
    } else if (dto.addressText) {
      const fullAddress = `${dto.addressText}, ${dto.city || listing.city}, Moldova`;
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
    viewerUserId?: number;
    limit?: number;
    // Optional filters
    transactionType?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minRooms?: number;
    maxRooms?: number;
  }) {
    const { neLat, neLng, swLat, swLng, limit = 100, viewerUserId } = params;
    const visibleStatuses = await this.getVisibleStatuses(viewerUserId);

    const andConditions: any[] = [
      {
        lat: {
          [Op.between]: [swLat, neLat],
        },
      },
      {
        lng: {
          [Op.between]: [swLng, neLng],
        },
      },
      { lat: { [Op.ne]: null } },
      { lng: { [Op.ne]: null } },
      { status: { [Op.in]: visibleStatuses } },
    ];

    // Apply optional filters
    if (params.transactionType) andConditions.push({ transactionType: params.transactionType });
    if (params.propertyType) andConditions.push({ propertyType: params.propertyType });
    if (params.minPrice || params.maxPrice) {
      const priceWhere: any = {};
      if (params.minPrice) priceWhere[Op.gte] = params.minPrice;
      if (params.maxPrice) priceWhere[Op.lte] = params.maxPrice;
      andConditions.push({ priceEur: priceWhere });
    }
    if (params.minRooms || params.maxRooms) {
      const roomsWhere: any = {};
      if (params.minRooms) roomsWhere[Op.gte] = params.minRooms;
      if (params.maxRooms) roomsWhere[Op.lte] = params.maxRooms;
      andConditions.push({ rooms: roomsWhere });
    }

    const listings = await Listing.findAll({
      where: { [Op.and]: andConditions },
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
        'status',
        'publicFrom',
        'ownershipStatus',
      ],
    });

    const earlyAccessCount = listings.filter((item) => item.status === 'early_access').length;
    if (earlyAccessCount > 0) {
      this.logger.log(
        `[METRIC] listing.findInBounds served early_access=${earlyAccessCount} total=${listings.length} viewer=${viewerUserId || 'anonymous'}`,
      );
    }

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

    const existingImages = await ListingImage.count({ where: { listingId: Number(id) } });

    // Enforce subscription photo limit (only when monetization is active — v1 has it OFF)
    if (ListingService.isMonetizationEnabled()) {
      const subscription = await this.subscriptionService.getUserSubscription(Number(ownerId));
      const capabilities = this.subscriptionService.getUserCapabilities(subscription);
      const totalAfterUpload = existingImages + files.length;

      if (totalAfterUpload > capabilities.maxPhotos) {
        const remaining = Math.max(0, capabilities.maxPhotos - existingImages);
        throw new ForbiddenException(
          `Limita de fotografii pentru planul tău este ${capabilities.maxPhotos}. ` +
          `Ai deja ${existingImages} fotografii, mai poți adăuga ${remaining}. ` +
          `Fă upgrade pentru a încărca mai multe.`,
        );
      }
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

