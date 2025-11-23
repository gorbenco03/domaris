import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';

import { Listing } from '../../db/entities/listing.entity.js';

import { OpenAiService } from '../../services/openai.service.js';
import { ListingImage } from '../../db/entities/listingImage.entity.js';
import { GroupSourceService } from '../../services/groupSource.service.js';
import { ApifyService } from '../../services/apify.service.js';
import { S3Service } from '../../s3/s3.service.js';
import { GroupSource } from '../../db/entities/groupSource.entity.js';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    @InjectModel(Listing)
    private readonly listingModel: typeof Listing,
    @InjectModel(ListingImage)
    private readonly listingImageModel: typeof ListingImage,
    private readonly apifyService: ApifyService,
    private readonly openAiService: OpenAiService,
    private readonly groupSourceService: GroupSourceService,
    private readonly fileStorageService:S3Service 
  ) {}

  /**
   * Rulează parsing-ul automat la fiecare 12 ore (00:00, 12:00).
   * Deocamdată doar pentru Timișoara, dar ulterior poți itera peste toate orașele.
   */
  @Cron('0 */12 * * *', {
    name: 'parseFacebookGroups',
    timeZone: 'Europe/Bucharest',
  })
  async handleScheduledParsing() {
    this.logger.log('🚀 Scheduled parsing job started (every 12 hours)');
    try {
      const result = await this.parseCityListings('timisoara');
      this.logger.log(
        `✅ Scheduled parsing completed: ${JSON.stringify(result)}`
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Error in scheduled parsing: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Parsează toate grupurile de Facebook pentru un oraș (ex: "timisoara")
   * și salvează anunțurile de la proprietari în Listings.
   */
  async parseCityListings(citySlug: string): Promise<{
    processed: number;
    created: number;
    updated: number;
    skipped: number;
  }> {
    this.logger.log(`Starting parsing process for city=${citySlug}...`);

    // 1. Citește grupurile active din DB
    const groups: GroupSource[] =
      await this.groupSourceService.getActiveByCitySlug(citySlug);

    if (!groups || groups.length === 0) {
      this.logger.warn(`No active Facebook groups found for city=${citySlug}`);
      return { processed: 0, created: 0, updated: 0, skipped: 0 };
    }

    this.logger.log(
      `Found ${groups.length} active groups for city=${citySlug}. Starting scraping...`
    );

    // Parse cookies from env if available (ai deja logic)
    let cookies: any[] | undefined;
    if (process.env.FACEBOOK_COOKIES) {
      try {
        cookies = JSON.parse(process.env.FACEBOOK_COOKIES);
      } catch (error) {
        this.logger.warn('Failed to parse FACEBOOK_COOKIES from env');
      }
    }

    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // 2. Rulează scraping pentru fiecare grup
    for (const group of groups) {
      this.logger.log(
        `Scraping group ${group.id} (${group.url}) for city=${citySlug}...`
      );

      try {
        const items = await this.apifyService.scrapeFacebookGroup({
          groupUrl: group.url,
          cookies,
        });

        this.logger.log(
          `Received ${items.length} items from Apify for groupId=${group.id}`
        );

        for (const item of items) {
          processed++;
          try {
            const result = await this.processListingItem(citySlug, group, item);
            if (result === 'created') created++;
            else if (result === 'updated') updated++;
            else skipped++;
          } catch (e: any) {
            this.logger.error(
              `Error processing item from groupId=${group.id}: ${e.message}`,
              e.stack
            );
            skipped++;
          }
        }
      } catch (e: any) {
        this.logger.error(
          `Error scraping groupId=${group.id}: ${e.message}`,
          e.stack
        );
      }
    }

    const stats = { processed, created, updated, skipped };
    this.logger.log(
      `Parsing completed for city=${citySlug}. Stats: ${JSON.stringify(stats)}`
    );
    return stats;
  }

  /**
   * Procesează un singur anunț (postare dintr-un grup).
   * - sare peste "caut chirie" + postări irelevante
   * - cheamă OpenAI să vadă dacă e proprietar sau agenție
   * - dacă e proprietar, creează/actualizează Listing & salvează imagini pe S3
   */
  private async processListingItem(
    citySlug: string,
    group: GroupSource,
    item: any
  ): Promise<'created' | 'updated' | 'skipped'> {
    // Extragere IDs
    const permalinkMatch = item.url?.match(/\/permalink\/(\d+)/);
    const externalPostId = permalinkMatch?.[1] || item.postId || item.id;
    const externalGroupId = item.groupId || group.id;
    const sourceUrl = item.url;

    if (!externalPostId) {
      this.logger.debug('Item missing postId, skipping.');
      return 'skipped';
    }

    const text = (item.text || '').trim();

    // Filtru hard simplu: text prea scurt
    if (!text || text.length < 20) {
      this.logger.debug(`Skipping postId=${externalPostId}: text too short.`);
      return 'skipped';
    }

    // Filtru: "caut chirie" / "caut garsoniera" etc. (seeker)
    if (this.isLookingForRent(text)) {
      this.logger.debug(
        `Skipping postId=${externalPostId}: detected looking-for-rent (not an offer).`
      );
      return 'skipped';
    }

    // Verifică dacă există deja listing
    const existingListing = await this.listingModel.findOne({
      where: {
        externalPostId,
        sourceType: 'facebook',
      },
    });

    // Extrage date brute din text
    const listingData = this.extractListingData(item, citySlug);

    // Analiză cu OpenAI: proprietar vs agenție
    const aiAnalysis = await this.openAiService.analyzeListingOwnerType(
      listingData.description || listingData.title || ''
    );

    const isAgency = aiAnalysis.isAgency || false;

    if (isAgency) {
      this.logger.debug(
        `Skipping postId=${externalPostId}: classified as agency by AI.`
      );
      return 'skipped';
    }

    // Dacă nu e agenție + nu e "caut chirie" → îl tratăm ca anunț de proprietar
    const listingPayload = {
      ...listingData,
      externalPostId,
      externalGroupId,
      sourceUrl,
      sourceType: 'facebook' as const,
      isAgency: false,
      aiMetadata: {
        ...aiAnalysis,
        analyzedAt: new Date(),
      },
      rawSource: item,
      scrapedAt: new Date(),
    };

    // Upload imagini la S3 & salvează în DB
    const rawImageUrls = this.extractImages(item);
    const s3Urls = await this.uploadImagesToS3(rawImageUrls, externalPostId);

    if (existingListing) {
      await existingListing.update(listingPayload);
      await this.saveListingImages(existingListing.id, s3Urls);
      return 'updated';
    } else {
      const newListing = await this.listingModel.create({
        ...listingPayload,
        status: 'new',
        publicFrom: new Date(),
      });

      await this.saveListingImages(newListing.id, s3Urls);
      return 'created';
    }
  }

  // ========== Imagini (S3) ==========

  private async uploadImagesToS3(
    imageUrls: string[],
    externalPostId: string | number
  ): Promise<string[]> {
    if (!imageUrls || imageUrls.length === 0) return [];

    const s3Urls: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        const s3Url = await this.fileStorageService.uploadFromUrl(url, {
          prefix: `listings/facebook/${externalPostId}`,
        });
        s3Urls.push(s3Url);
      } catch (e: any) {
        this.logger.warn(
          `Failed to upload image ${i} for postId=${externalPostId}: ${e.message}`
        );
      }
    }

    return s3Urls;
  }

  private async saveListingImages(
    listingId: number,
    images: string[]
  ): Promise<void> {
    // Șterge imaginile vechi
    await this.listingImageModel.destroy({
      where: { listingId },
    });

    if (!images || images.length === 0) return;

    // Salvează noile imagini
    for (let i = 0; i < images.length; i++) {
      await this.listingImageModel.create({
        listingId,
        url: images[i],
        isPrimary: i === 0,
        alt: `Imagine ${i + 1}`,
      });
    } 

  }

  // ========== Helpers pentru text & extragere info ==========

  /** detectează postările de tip "caut chirie / garsonieră / apartament" */
  private isLookingForRent(text: string): boolean {
    const lower = text.toLowerCase();

    // very naive, dar suficient ca pre-filtru
    const hasCaut =
      /(?:caut|căutăm|cautam|căutam)\s+(?:chirie|garsonieră|garsoniera|apartament|studio|inchiriere|închiriere)/i.test(
        text
      );

    const hasLookingFor =
      /(looking\s+for\s+a\s+room|looking\s+for\s+an\s+apartment)/i.test(text);

    return hasCaut || hasLookingFor;
  }

  private extractImages(item: any): string[] {
    if (
      !item.attachments ||
      !Array.isArray(item.attachments) ||
      item.attachments.length === 0
    ) {
      return [];
    }

    const images: string[] = [];
    for (const attachment of item.attachments) {
      if (
        attachment.type === 'album' &&
        attachment.images &&
        Array.isArray(attachment.images)
      ) {
        for (const image of attachment.images) {
          if (image.url) {
            images.push(image.url);
          }
        }
      } else if (attachment.type === 'photo' && attachment.url) {
        images.push(attachment.url);
      }
    }

    return images;
  }

  /**
   * Extract listing data (poți reutiliza helper-ele tale vechi: extractPrice, extractRooms etc.).
   */
  private extractListingData(item: any, citySlug: string): Partial<Listing> {
    const text = item.text || '';
    const titleParts = text
      .split('\n')
      .filter((line: string) => line.trim().length > 0);
    const title =
      titleParts[0]?.substring(0, 200) ||
      text.substring(0, 200) ||
      'Anunț Facebook';

    return {
      title: title.trim(),
      description: text.trim(),
      city: this.extractCityFromText(text, citySlug),
      neighborhood: this.extractNeighborhoodFromText(text),
      priceEur: this.extractPrice(text),
      rooms: this.extractRooms(text),
      surfaceSqm: this.extractSurface(text),
      isFurnished: this.extractFurnished(text),
      hasCentralHeating: this.extractCentralHeating(text),
      addressText: this.extractAddress(text),
      lat: undefined,
      lng: undefined,
      postedAt: item.createdAt ? new Date(item.createdAt * 1000) : new Date(),
    };
  }

  // aici poți păstra (și ușor adapta) toate helper-ele tale vechi:
  // extractCityFromText, extractNeighborhoodFromText, extractAddress,
  // extractPrice, extractRooms, extractSurface, extractFurnished, extractCentralHeating.
  // le-am lăsat cu semnătură puțin extinsă la citySlug:

  private extractCityFromText(text: string, defaultSlug: string): string {
    // poți păstra regex-urile tale, doar că dacă nu găsește
    // întoarce ceva consistent cu orașul (ex: "Timișoara" pt "timisoara")
    // aici pun simplu:
    if (/Timișoara|Timisoara/i.test(text)) return 'Timișoara';
    if (/București|Bucuresti/i.test(text)) return 'București';
    // ... restul mapării
    if (defaultSlug === 'timisoara') return 'Timișoara';
    return defaultSlug;
  }

  private extractNeighborhoodFromText(text: string): string {
    // copiat din versiunea ta, poți lăsa la fel
    return '';
  }

  private extractAddress(text: string): string {
    return '';
  }

  private extractPrice(text: string): number {
    return 0;
  }

  private extractRooms(text: string): number {
    return 0;
  }

  private extractSurface(text: string): number {
    return 0;
  }

  private extractFurnished(text: string): boolean {
    return false;
  }

  private extractCentralHeating(text: string): boolean {
    return false;
  }
}
