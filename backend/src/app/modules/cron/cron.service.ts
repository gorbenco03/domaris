/**
 * 📅 CRON SERVICE - Scheduled Jobs
 * 
 * Jobs configurate:
 * 1. checkNewPropertyMatches - La fiecare oră, verifică căutări salvate
 * 2. sendViewingReminders - La fiecare 15 minute, trimite remindere
 * 3. dailyAlertDigest - O dată pe zi la 08:00, trimite rezumat alerte DAILY
 * 4. weeklyAlertDigest - O dată pe săptămână duminică la 10:00, rezumat WEEKLY
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SavedSearchService } from '../saved-search/saved-search.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { Viewing } from '../../db/entities/viewing.entity.js';
import { SavedSearch } from '../../db/entities/saved-search.entity.js';
import { User } from '../../db/entities/user.entity.js';
import { Op } from 'sequelize';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly savedSearchService: SavedSearchService,
    private readonly notificationService: NotificationService,
  ) {
    this.logger.log('🕐 CronService initialized');
  }

  // ========================================================================
  // 🔍 SAVED SEARCHES - Check for new matches
  // ========================================================================

  /**
   * Verifică căutările salvate pentru proprietăți noi
   * Rulează la fiecare oră
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkNewPropertyMatches() {
    this.logger.log('🔍 [CRON] Checking saved searches for new matches...');

    try {
      const alertsTriggered = await this.savedSearchService.checkNewMatches();
      this.logger.log(
        `✅ [CRON] Saved search check complete. ${alertsTriggered} searches with new matches.`,
      );
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Saved search check failed: ${error.message}`);
    }
  }

  // ========================================================================
  // 📅 VIEWING REMINDERS
  // ========================================================================

  /**
   * Trimite remindere pentru vizionări
   * Rulează la fiecare 15 minute
   * Nota: Viewing entity are seekerId (în loc de userId) și slot (în loc de scheduledAt)
   */
  @Cron('*/15 * * * *') // Every 15 minutes
  async sendViewingReminders() {
    this.logger.log('📅 [CRON] Checking for upcoming viewings...');

    try {
      const now = new Date();
      
      // 1. Remindere pentru 1 ora inainte
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneHourWindowStart = new Date(oneHourFromNow.getTime() - 15 * 60 * 1000);
      
      // Nota: Viewing entity folosește 'slot' pentru dată și 'accepted' pentru confirmat
      const upcomingIn1Hour = await Viewing.findAll({
        where: {
          slot: {
            [Op.between]: [oneHourWindowStart, oneHourFromNow],
          },
          status: 'accepted', // Entity are 'pending', 'accepted', 'rejected', 'cancelled'
          // Evită trimiterea duplicate
          updatedAt: {
            [Op.lt]: new Date(now.getTime() - 60 * 60 * 1000),
          },
        },
        include: [{ model: User, as: 'seeker' }],
      });

      for (const viewing of upcomingIn1Hour) {
        // Viewing are seekerId, nu userId
        await this.notificationService.create(viewing.seekerId, {
          type: 'VIEWING_REMINDER',
          title: '⏰ Reminder: Vizionare în 1 oră',
          body: `Ai o vizionare programată în curând!`,
          data: { viewingId: viewing.id },
        });
        
        // Mark as reminded
        await viewing.update({ updatedAt: new Date() });
      }

      // 2. Remindere pentru 1 zi inainte (verifica doar o data pe ora)
      if (now.getMinutes() < 15) {
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const oneDayWindowStart = new Date(oneDayFromNow.getTime() - 60 * 60 * 1000);

        const upcomingIn1Day = await Viewing.findAll({
          where: {
            slot: {
              [Op.between]: [oneDayWindowStart, oneDayFromNow],
            },
            status: 'accepted',
          },
          include: [{ model: User, as: 'seeker' }],
        });

        for (const viewing of upcomingIn1Day) {
          await this.notificationService.create(viewing.seekerId, {
            type: 'VIEWING_REMINDER',
            title: '📅 Reminder: Vizionare mâine',
            body: `Ai o vizionare programată pentru mâine.`,
            data: { viewingId: viewing.id },
          });
        }

        this.logger.log(
          `✅ [CRON] Sent ${upcomingIn1Day.length} 1-day reminders`,
        );
      }

      this.logger.log(
        `✅ [CRON] Sent ${upcomingIn1Hour.length} 1-hour reminders`,
      );
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Viewing reminder check failed: ${error.message}`);
    }
  }

  // ========================================================================
  // 📬 DAILY ALERT DIGEST
  // ========================================================================

  /**
   * Trimite rezumat zilnic pentru căutări cu alerte DAILY
   * Rulează zilnic la 08:00
   */
  @Cron('0 8 * * *') // Every day at 08:00
  async sendDailyAlertDigest() {
    this.logger.log('📬 [CRON] Sending daily alert digest...');

    try {
      const searchesWithAlerts = await SavedSearch.findAll({
        where: {
          alertsEnabled: true,
          alertFrequency: 'DAILY',
          newMatchesCount: {
            [Op.gt]: 0,
          },
        },
        include: [{ model: User, as: 'user' }],
      });

      for (const search of searchesWithAlerts) {
        const userName = (search as any).user?.firstName || 'Utilizator';
        
        await this.notificationService.create(search.userId, {
          type: 'NEW_PROPERTY_MATCH',
          title: `🏠 ${search.newMatchesCount} proprietăți noi pentru "${search.name}"`,
          body: `Bună ${userName}! Am găsit ${search.newMatchesCount} proprietăți noi care corespund căutării tale.`,
          data: { savedSearchId: search.id },
        });

        // Reset counter and update lastAlertAt
        await search.update({
          newMatchesCount: 0,
          lastAlertAt: new Date(),
        });
      }

      this.logger.log(
        `✅ [CRON] Daily digest sent to ${searchesWithAlerts.length} users`,
      );
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Daily digest failed: ${error.message}`);
    }
  }

  // ========================================================================
  // 📬 WEEKLY ALERT DIGEST
  // ========================================================================

  /**
   * Trimite rezumat săptămânal pentru căutări cu alerte WEEKLY
   * Rulează duminică la 10:00
   */
  @Cron('0 10 * * 0') // Every Sunday at 10:00
  async sendWeeklyAlertDigest() {
    this.logger.log('📬 [CRON] Sending weekly alert digest...');

    try {
      const searchesWithAlerts = await SavedSearch.findAll({
        where: {
          alertsEnabled: true,
          alertFrequency: 'WEEKLY',
          newMatchesCount: {
            [Op.gt]: 0,
          },
        },
        include: [{ model: User, as: 'user' }],
      });

      for (const search of searchesWithAlerts) {
        const userName = (search as any).user?.firstName || 'Utilizator';
        
        await this.notificationService.create(search.userId, {
          type: 'NEW_PROPERTY_MATCH',
          title: `📊 Rezumat săptămânal: ${search.newMatchesCount} proprietăți noi`,
          body: `Bună ${userName}! Săptămâna aceasta am găsit ${search.newMatchesCount} proprietăți noi pentru "${search.name}".`,
          data: { savedSearchId: search.id },
        });

        // Reset counter and update lastAlertAt
        await search.update({
          newMatchesCount: 0,
          lastAlertAt: new Date(),
        });
      }

      this.logger.log(
        `✅ [CRON] Weekly digest sent to ${searchesWithAlerts.length} users`,
      );
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Weekly digest failed: ${error.message}`);
    }
  }

  // ========================================================================
  // 🔄 INSTANT ALERTS (called from SavedSearchService)
  // ========================================================================

  /**
   * Trimite alertă instantanee pentru o căutare specifică
   * Aceasta este apelată de SavedSearchService când detectează match-uri noi
   */
  async sendInstantAlert(savedSearchId: number) {
    try {
      const search = await SavedSearch.findByPk(savedSearchId, {
        include: [{ model: User, as: 'user' }],
      });

      if (!search || !search.alertsEnabled || search.alertFrequency !== 'INSTANT') {
        return;
      }

      const userName = (search as any).user?.firstName || 'Utilizator';

      await this.notificationService.create(search.userId, {
        type: 'NEW_PROPERTY_MATCH',
        title: `🆕 Proprietate nouă pentru "${search.name}"!`,
        body: `Bună ${userName}! Tocmai a apărut o proprietate care corespunde căutării tale.`,
        data: { savedSearchId: search.id },
      });

      // Update lastAlertAt
      await search.update({ lastAlertAt: new Date() });

      this.logger.log(`📬 Instant alert sent for search ${savedSearchId}`);
    } catch (error: any) {
      this.logger.error(`❌ Instant alert failed: ${error.message}`);
    }
  }

  // ========================================================================
  // 🧹 CLEANUP JOBS
  // ========================================================================

  /**
   * Curăță notificările vechi (mai vechi de 90 zile)
   * Rulează zilnic la 03:00
   */
  @Cron('0 3 * * *') // Every day at 03:00
  async cleanupOldNotifications() {
    this.logger.log('🧹 [CRON] Cleaning up old notifications...');

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // NotificationService should have a cleanup method
      // For now, log placeholder
      this.logger.log(`✅ [CRON] Cleanup complete (placeholder)`);
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Cleanup failed: ${error.message}`);
    }
  }
}
