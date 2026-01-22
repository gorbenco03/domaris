/**
 * 🔖 SAVED SEARCHES SERVICE
 * 
 * Funcționalități:
 * - CRUD pentru căutări salvate
 * - Activare/Dezactivare alerte
 * - Verificare match-uri noi
 * - Executare căutare salvată
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SavedSearch } from '../../db/entities/saved-search.entity.js';
import { SearchService, SearchFilters } from '../search/search.service.js';

interface CreateSavedSearchDto {
  name: string;
  params: SearchFilters;
  alertsEnabled?: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

interface UpdateSavedSearchDto {
  name?: string;
  params?: SearchFilters;
  alertsEnabled?: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

@Injectable()
export class SavedSearchService {
  private readonly logger = new Logger(SavedSearchService.name);

  constructor(private readonly searchService: SearchService) {}

  // ========================================================================
  // 📋 LIST & GET
  // ========================================================================

  /**
   * Get all saved searches for a user
   */
  async getAll(userId: number) {
    const searches = await SavedSearch.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return {
      data: searches.map((s) => this.format(s)),
      total: searches.length,
    };
  }

  /**
   * Get single saved search by ID
   */
  async getById(userId: number, searchId: number) {
    const search = await SavedSearch.findOne({
      where: { id: searchId, userId },
    });

    if (!search) {
      throw new NotFoundException('Saved search not found');
    }

    // Resetează newMatchesCount când user-ul vizualizează
    if (search.newMatchesCount > 0) {
      await search.update({
        newMatchesCount: 0,
        lastViewedAt: new Date(),
      });
    }

    return this.format(search);
  }

  // ========================================================================
  // ➕ CREATE
  // ========================================================================

  /**
   * Create a new saved search
   */
  async create(userId: number, dto: CreateSavedSearchDto) {
    // Verifică dacă există deja o căutare cu același nume
    const existing = await SavedSearch.findOne({
      where: { userId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('A saved search with this name already exists');
    }

    // Obține numărul de rezultate pentru parametrii de căutare
    const searchResult = await this.searchService.search({
      ...dto.params,
      page: 1,
      limit: 1,
    });

    const search = await SavedSearch.create({
      userId,
      name: dto.name,
      params: dto.params,
      alertsEnabled: dto.alertsEnabled ?? false,
      alertFrequency: dto.alertsEnabled ? (dto.alertFrequency ?? 'DAILY') : undefined,
      totalMatchesCount: searchResult.meta.total,
      newMatchesCount: 0,
    } as any);

    this.logger.log(
      `User ${userId} created saved search "${dto.name}" (${searchResult.meta.total} matches)`
    );

    return this.format(search);
  }

  // ========================================================================
  // ✏️ UPDATE
  // ========================================================================

  /**
   * Update saved search
   */
  async update(userId: number, searchId: number, dto: UpdateSavedSearchDto) {
    const search = await SavedSearch.findOne({
      where: { id: searchId, userId },
    });

    if (!search) {
      throw new NotFoundException('Saved search not found');
    }

    // Dacă se schimbă numele, verifică unicitatea
    if (dto.name && dto.name !== search.name) {
      const existing = await SavedSearch.findOne({
        where: { userId, name: dto.name },
      });
      if (existing) {
        throw new ConflictException('A saved search with this name already exists');
      }
    }

    // Recalculează totalMatchesCount dacă params se schimbă
    let totalMatchesCount = search.totalMatchesCount;
    if (dto.params) {
      const searchResult = await this.searchService.search({
        ...dto.params,
        page: 1,
        limit: 1,
      });
      totalMatchesCount = searchResult.meta.total;
    }

    await search.update({
      ...(dto.name && { name: dto.name }),
      ...(dto.params && { params: dto.params }),
      ...(typeof dto.alertsEnabled !== 'undefined' && { alertsEnabled: dto.alertsEnabled }),
      ...(dto.alertFrequency && { alertFrequency: dto.alertFrequency }),
      totalMatchesCount,
    });

    this.logger.log(`User ${userId} updated saved search ${searchId}`);

    return this.format(search);
  }

  // ========================================================================
  // 🗑️ DELETE
  // ========================================================================

  /**
   * Delete saved search
   */
  async delete(userId: number, searchId: number) {
    const search = await SavedSearch.findOne({
      where: { id: searchId, userId },
    });

    if (!search) {
      throw new NotFoundException('Saved search not found');
    }

    await search.destroy();

    this.logger.log(`User ${userId} deleted saved search ${searchId}`);

    return { success: true };
  }

  // ========================================================================
  // 🚀 EXECUTE & ALERTS
  // ========================================================================

  /**
   * Execute a saved search (return results)
   */
  async execute(userId: number, searchId: number, page = 1, limit = 20) {
    const search = await SavedSearch.findOne({
      where: { id: searchId, userId },
    });

    if (!search) {
      throw new NotFoundException('Saved search not found');
    }

    const results = await this.searchService.search({
      ...(search.params as SearchFilters),
      page,
      limit,
    });

    // Update lastViewedAt și reset newMatchesCount
    await search.update({
      lastViewedAt: new Date(),
      newMatchesCount: 0,
      totalMatchesCount: results.meta.total,
    });

    return {
      savedSearch: this.format(search),
      results,
    };
  }

  /**
   * Toggle alerts for a saved search
   */
  async toggleAlerts(
    userId: number,
    searchId: number,
    enabled: boolean,
    frequency?: 'INSTANT' | 'DAILY' | 'WEEKLY'
  ) {
    const search = await SavedSearch.findOne({
      where: { id: searchId, userId },
    });

    if (!search) {
      throw new NotFoundException('Saved search not found');
    }

    await search.update({
      alertsEnabled: enabled,
      alertFrequency: enabled ? (frequency ?? 'DAILY') : undefined,
    });

    this.logger.log(
      `User ${userId} ${enabled ? 'enabled' : 'disabled'} alerts for search ${searchId}`
    );

    return this.format(search);
  }

  /**
   * Check for new matches across ALL saved searches with alerts enabled
   * Used by cron job - returns count of searches with new matches
   */
  async checkNewMatches(): Promise<number> {
    const searches = await SavedSearch.findAll({
      where: {
        alertsEnabled: true,
      },
    });

    let alertsTriggeredCount = 0;

    for (const search of searches) {
      try {
        const searchResult = await this.searchService.search({
          ...(search.params as SearchFilters),
          page: 1,
          limit: 1,
        });

        const currentTotal = searchResult.meta.total;
        const previousTotal = search.totalMatchesCount;
        const newCount = Math.max(0, currentTotal - previousTotal);

        if (newCount > 0) {
          await search.update({
            newMatchesCount: search.newMatchesCount + newCount,
            totalMatchesCount: currentTotal,
          });

          alertsTriggeredCount++;

          this.logger.log(
            `Search "${search.name}" has ${newCount} new matches (user ${search.userId})`
          );
        }
      } catch (error: any) {
        this.logger.error(`Error checking search ${search.id}: ${error.message}`);
      }
    }

    return alertsTriggeredCount;
  }

  /**
   * Check for new matches for a specific user
   */
  async checkNewMatchesForUser(userId: number): Promise<{ searchId: number; name: string; newCount: number }[]> {
    const searches = await SavedSearch.findAll({
      where: {
        userId,
        alertsEnabled: true,
      },
    });

    const results: { searchId: number; name: string; newCount: number }[] = [];

    for (const search of searches) {
      const searchResult = await this.searchService.search({
        ...(search.params as SearchFilters),
        page: 1,
        limit: 1,
      });

      const currentTotal = searchResult.meta.total;
      const previousTotal = search.totalMatchesCount;
      const newCount = Math.max(0, currentTotal - previousTotal);

      if (newCount > 0) {
        await search.update({
          newMatchesCount: search.newMatchesCount + newCount,
          totalMatchesCount: currentTotal,
        });

        results.push({
          searchId: search.id,
          name: search.name,
          newCount,
        });
      }
    }

    return results;
  }

  // ========================================================================
  // 🔧 HELPERS
  // ========================================================================

  private format(search: SavedSearch) {
    return {
      id: search.id,
      name: search.name,
      params: search.params,
      alertsEnabled: search.alertsEnabled,
      alertFrequency: search.alertFrequency,
      lastAlertAt: search.lastAlertAt,
      newMatchesCount: search.newMatchesCount,
      totalMatchesCount: search.totalMatchesCount,
      lastViewedAt: search.lastViewedAt,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    };
  }
}
