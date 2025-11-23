import { Injectable, Logger } from '@nestjs/common';
import { ApifyClient } from 'apify-client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);
  private client!: ApifyClient;

  constructor() {
    this.logger.log('🔧 Initializing ApifyService...');
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      this.logger.error('❌ APIFY_TOKEN nu este setat în environment variables');
      this.logger.error('💡 Adaugă APIFY_TOKEN în .dev.env pentru a folosi Apify scraping');
      // Nu aruncăm eroare, doar log-ăm - parser-ul va eșua doar când încearcă să folosească Apify
      // throw new Error('APIFY_TOKEN is required');
    } else {
      this.logger.log('✅ APIFY_TOKEN found');
    }

    if (token) {
      this.client = new ApifyClient({
        token,
        maxRetries: 8,
        minDelayBetweenRetriesMillis: 500,
        timeoutSecs: 360, // 6 minutes
      });

      this.logger.log('✅ ApifyService initialized successfully');
    } else {
      this.logger.warn('⚠️  ApifyService initialized WITHOUT token - scraping will fail');
    }
  }

  /**
   * Rulează Actor-ul Apify pentru scraping de Facebook groups
   * @param input - Input pentru Actor (groupUrl este obligatoriu, cookies sunt opționale dar recomandate)
   * @returns Rezultatele din dataset
   */
  /**
   * Verifică dacă client-ul este inițializat
   */
  private ensureClient() {
    if (!this.client) {
      throw new Error('ApifyService is not initialized. APIFY_TOKEN is required.');
    }
  }

  async scrapeFacebookGroup(input?: {
    groupUrl: string; // URL-ul grupului Facebook (obligatoriu)
    cookies?: any[]; // Array de cookie-uri Facebook pentru autentificare (opțional dar recomandat)
    cursor?: string;
    sortType?: string;
    minDelay?: number;
    maxDelay?: number;
    proxy?: {
      useApifyProxy: boolean;
    };
  }): Promise<any[]> {
    this.ensureClient();
    const actorId = 'AtBpiepuIUNs2k2ku';

    // URL-ul grupului Facebook este obligatoriu
    const groupUrl = input?.groupUrl || process.env.FACEBOOK_GROUP_URL;
    if (!groupUrl) {
      throw new Error('groupUrl is required for Apify Actor. Set it in input or FACEBOOK_GROUP_URL env var.');
    }

    // Parse cookies - încearcă din input, apoi din fișier JSON, apoi din env
    let cookies: any[] | undefined;
    if (input?.cookies) {
      cookies = input.cookies;
    } else {
      // Încearcă să citească din fișier JSON (prioritate)
      const cookiesFile = path.join(process.cwd(), 'facebook-cookies.json');
      if (fs.existsSync(cookiesFile)) {
        try {
          const cookiesData = fs.readFileSync(cookiesFile, 'utf-8');
          cookies = JSON.parse(cookiesData);
          this.logger.log(`Loaded cookies from ${cookiesFile}`);
        } catch (error: any) {
          this.logger.warn(`Failed to load cookies from file: ${error.message}`);
        }
      }
      
      // Dacă nu a reușit din fișier, încearcă din env
      if (!cookies && process.env.FACEBOOK_COOKIES) {
        try {
          // Remove surrounding quotes if present and trim whitespace
          let cookiesStr = process.env.FACEBOOK_COOKIES.trim();
          if ((cookiesStr.startsWith("'") && cookiesStr.endsWith("'")) ||
              (cookiesStr.startsWith('"') && cookiesStr.endsWith('"'))) {
            cookiesStr = cookiesStr.slice(1, -1);
          }
          cookies = JSON.parse(cookiesStr);
          if (!Array.isArray(cookies)) {
            this.logger.warn('FACEBOOK_COOKIES is not a valid JSON array');
            cookies = undefined;
          }
        } catch (error: any) {
          this.logger.warn(`Failed to parse FACEBOOK_COOKIES from env: ${error.message}`);
          cookies = undefined;
        }
      }
    }

    // Actor-ul Apify folosește flat structure: "scrapeGroupPosts.groupUrl" (nu nested)
    const defaultInput: any = {
      'scrapeGroupPosts.groupUrl': groupUrl, // Flat structure
      cursor: input?.cursor || '',
      sortType: input?.sortType || 'new_posts',
      minDelay: input?.minDelay || 1,
      maxDelay: input?.maxDelay || 10,
      proxy: input?.proxy || {
        useApifyProxy: true,
      },
    };

    // Adaugă cookies dacă sunt disponibile
    if (cookies && Array.isArray(cookies)) {
      defaultInput.cookie = cookies;
      this.logger.log(`Using ${cookies.length} Facebook cookies for authentication`);
    } else {
      this.logger.warn('No cookies provided. Scraping may fail without Facebook authentication.');
    }

    try {
      this.logger.log(`Starting Apify Actor: ${actorId}`);
      this.logger.debug('Actor input:', JSON.stringify(defaultInput, null, 2));

      // Start Actor and wait for completion
      // Note: .call() automatically waits for the actor to finish
      const run = await this.client.actor(actorId).call(defaultInput);

      this.logger.log(`Actor run completed. Status: ${run.status}`);
      this.logger.log(`Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

      if (run.status !== 'SUCCEEDED' || !run.defaultDatasetId) {
        throw new Error(`Actor run failed with status: ${run.status}`);
      }

      // Fetch all items from dataset
      const allItems: any[] = [];
      const limit = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { items, total } = await this.client
          .dataset(run.defaultDatasetId)
          .listItems({ limit, offset });

        allItems.push(...items);
        this.logger.debug(`Fetched ${items.length} items (${allItems.length}/${total} total)`);

        if (offset + limit >= total) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      this.logger.log(`Total items fetched: ${allItems.length}`);
      return allItems;
    } catch (error: any) {
      this.logger.error('Error running Apify Actor:', error.message);
      if (error.statusCode) {
        this.logger.error(`Status Code: ${error.statusCode}`);
      }
      if (error.type) {
        this.logger.error(`Error Type: ${error.type}`);
      }
      throw error;
    }
  }

  /**
   * Verifică statusul ultimului run al Actor-ului
   */
  async getLastRunStatus(): Promise<any> {
    try {
      this.ensureClient();
      const actorId = 'AtBpiepuIUNs2k2ku';
      const lastRun = await this.client.actor(actorId).lastRun({ status: 'SUCCEEDED' });
      return lastRun;
    } catch (error: any) {
      this.logger.error('Error getting last run status:', error.message);
      return null;
    }
  }

}

