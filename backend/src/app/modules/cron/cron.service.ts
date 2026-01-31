/**
 * 📅 CRON SERVICE - Scheduled Jobs
 *
 * Jobs configurate:
 * 1. checkNewPropertyMatches - La fiecare oră, verifică căutări salvate
 * 2. sendViewingReminders - La fiecare 15 minute, trimite remindere
 * 3. dailyAlertDigest - O dată pe zi la 08:00, trimite rezumat alerte DAILY
 * 4. weeklyAlertDigest - O dată pe săptămână duminică la 10:00, rezumat WEEKLY
 * 5. expirePromotions - La fiecare oră, expiră promoțiile terminate
 * 6. processExpiredSubscriptions - Zilnic la 02:00, procesează subscripții expirate
 * 7. resetMonthlyBoostCounters - La 1 ale lunii, resetează contoarele de boost
 */

import { Injectable, Logger, Inject, forwardRef, Optional } from '@nestjs/common';
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
  // ⭐ VIEWING COMPLETION & FEEDBACK REQUESTS
  // ========================================================================

  /**
   * Marchează vizionările ca finalizate după ce a trecut ora programată
   * și trimite notificări pentru a cere feedback
   * Rulează la fiecare 30 de minute
   */
  @Cron('*/30 * * * *') // Every 30 minutes
  async completeViewingsAndRequestFeedback() {
    this.logger.log('⭐ [CRON] Checking for completed viewings...');

    try {
      const now = new Date();
      // Vizionările care au trecut cu cel puțin 1 oră
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Găsește vizionările acceptate care au trecut
      const pastViewings = await Viewing.findAll({
        where: {
          status: 'accepted',
          slot: {
            [Op.lt]: oneHourAgo,
          },
        },
        include: [
          { model: User, as: 'seeker', attributes: ['id', 'firstName'] },
        ],
      });

      let completedCount = 0;
      let notificationsSent = 0;

      for (const viewing of pastViewings) {
        // Marchează ca finalizată
        viewing.status = 'completed';
        await viewing.save();
        completedCount++;

        // Trimite notificare pentru feedback dacă nu a fost trimisă
        if (!viewing.feedbackRequestSent) {
          const seekerName = (viewing as any).seeker?.firstName || 'utilizator';

          // Lazy import pentru a obține ownerId din listing
          const { Listing } = await import('../../db/entities/listing.entity.js');
          const listing = await Listing.findByPk(viewing.propertyId, {
            attributes: ['id', 'ownerId', 'title'],
          });

          if (listing) {
            // Notificare pentru seeker (cel care a vizionat)
            await this.notificationService.create(viewing.seekerId, {
              type: 'feedback_request',
              title: '⭐ Cum a fost vizionarea?',
              body: `Lasă un feedback despre vizionarea pentru "${listing.title}"`,
              metadata: {
                viewingId: viewing.id,
                propertyId: viewing.propertyId,
              },
            });

            // Notificare pentru owner (proprietar)
            await this.notificationService.create(listing.ownerId, {
              type: 'feedback_request',
              title: '⭐ Evaluează vizitatul',
              body: `Lasă un feedback despre ${seekerName} care a vizionat proprietatea ta`,
              metadata: {
                viewingId: viewing.id,
                propertyId: viewing.propertyId,
              },
            });

            notificationsSent += 2;
          }

          viewing.feedbackRequestSent = true;
          await viewing.save();
        }
      }

      if (completedCount > 0) {
        this.logger.log(
          `✅ [CRON] Marked ${completedCount} viewings as completed, sent ${notificationsSent} feedback requests`,
        );
      }
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Viewing completion check failed: ${error.message}`);
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

  // ========================================================================
  // 💰 MONETIZATION JOBS
  // ========================================================================

  /**
   * Expiră promoțiile terminate
   * Rulează la fiecare oră
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expirePromotions() {
    this.logger.log('💰 [CRON] Checking for expired promotions...');

    try {
      // Lazy import to avoid circular dependency
      const { PromotionService } = await import('../monetization/services/promotion.service.js');
      const { ListingPromotion } = await import('../../db/entities/listing-promotion.entity.js');

      const now = new Date();

      // Expire promotions that have passed their end date
      const [count] = await ListingPromotion.update(
        { status: 'expired' },
        {
          where: {
            status: 'active',
            endDate: { [Op.lt]: now },
          },
        },
      );

      if (count > 0) {
        this.logger.log(`✅ [CRON] Expired ${count} promotions`);

        // Optionally send notifications to users whose promotions expired
        const expiredPromotions = await ListingPromotion.findAll({
          where: {
            status: 'expired',
            updatedAt: {
              [Op.gte]: new Date(now.getTime() - 60 * 60 * 1000), // Last hour
            },
          },
          attributes: ['userId', 'listingId'],
        });

        for (const promotion of expiredPromotions) {
          await this.notificationService.create(promotion.userId, {
            type: 'PROMOTION_EXPIRED',
            title: '⏰ Promoția ta a expirat',
            body: 'Promoția pentru anunțul tău a expirat. Poți să o reînnoiești din aplicație.',
            metadata: { listingId: promotion.listingId },
          });
        }
      } else {
        this.logger.log('✅ [CRON] No promotions to expire');
      }
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Expire promotions failed: ${error.message}`);
    }
  }

  /**
   * Procesează subscripțiile expirate
   * Rulează zilnic la 02:00
   */
  @Cron('0 2 * * *') // Every day at 02:00
  async processExpiredSubscriptions() {
    this.logger.log('💰 [CRON] Processing expired subscriptions...');

    try {
      const { UserSubscription } = await import('../../db/entities/user-subscription.entity.js');
      const { SubscriptionPlan } = await import('../../db/entities/subscription-plan.entity.js');

      const now = new Date();
      const gracePeriodDays = 7;

      // 1. Move active subscriptions past end date to past_due
      const [pastDueCount] = await UserSubscription.update(
        {
          status: 'past_due',
          gracePeriodEndsAt: new Date(now.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000),
        },
        {
          where: {
            status: 'active',
            currentPeriodEnd: { [Op.lt]: now },
          },
        },
      );

      if (pastDueCount > 0) {
        this.logger.log(`⚠️ [CRON] Moved ${pastDueCount} subscriptions to past_due`);

        // Notify users about past due
        const pastDueSubscriptions = await UserSubscription.findAll({
          where: { status: 'past_due' },
          attributes: ['userId'],
        });

        for (const sub of pastDueSubscriptions) {
          await this.notificationService.create(sub.userId, {
            type: 'SUBSCRIPTION_PAST_DUE',
            title: '⚠️ Abonamentul tău necesită atenție',
            body: 'Plata pentru abonamentul tău nu a fost procesată. Ai 7 zile pentru a actualiza metoda de plată.',
          });
        }
      }

      // 2. Expire trialing subscriptions
      const [trialExpiredCount] = await UserSubscription.update(
        { status: 'expired' },
        {
          where: {
            status: 'trialing',
            trialEndsAt: { [Op.lt]: now },
          },
        },
      );

      if (trialExpiredCount > 0) {
        this.logger.log(`⏰ [CRON] Expired ${trialExpiredCount} trial subscriptions`);
      }

      // 3. Expire past_due subscriptions after grace period
      const [expiredCount] = await UserSubscription.update(
        { status: 'expired' },
        {
          where: {
            status: 'past_due',
            gracePeriodEndsAt: { [Op.lt]: now },
          },
        },
      );

      if (expiredCount > 0) {
        this.logger.log(`❌ [CRON] Fully expired ${expiredCount} subscriptions`);

        // Update user flags
        const expiredSubs = await UserSubscription.findAll({
          where: {
            status: 'expired',
            updatedAt: { [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
          attributes: ['userId'],
        });

        const userIds = expiredSubs.map((s) => s.userId);
        if (userIds.length > 0) {
          await User.update(
            { hasActiveSubscription: false, subscriptionExpiresAt: null },
            { where: { id: { [Op.in]: userIds } } },
          );

          for (const userId of userIds) {
            await this.notificationService.create(userId, {
              type: 'SUBSCRIPTION_EXPIRED',
              title: '📉 Abonamentul tău a expirat',
              body: 'Abonamentul tău a expirat. Acum ai acces doar la funcțiile planului gratuit.',
            });
          }
        }
      }

      this.logger.log('✅ [CRON] Subscription expiration check complete');
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Subscription expiration failed: ${error.message}`);
    }
  }

  /**
   * Resetează contoarele de boost-uri lunare
   * Rulează la 1 ale fiecărei luni la 00:05
   */
  @Cron('5 0 1 * *') // Day 1 of each month at 00:05
  async resetMonthlyBoostCounters() {
    this.logger.log('🔄 [CRON] Resetting monthly boost counters...');

    try {
      const { UserSubscription } = await import('../../db/entities/user-subscription.entity.js');

      const now = new Date();

      const [count] = await UserSubscription.update(
        {
          boostsUsedThisMonth: 0,
          boostsResetAt: now,
        },
        {
          where: {
            status: { [Op.in]: ['active', 'trialing'] },
          },
        },
      );

      this.logger.log(`✅ [CRON] Reset boost counters for ${count} subscriptions`);
    } catch (error: any) {
      this.logger.error(`❌ [CRON] Boost counter reset failed: ${error.message}`);
    }
  }
}
