/**
 * 📅 CRON MODULE - Schedulare automată pentru tasks recurente
 * 
 * Jobs:
 * - Verificare căutări salvate pentru match-uri noi
 * - Reminder-uri pentru vizionări (1 zi înainte, 1 oră înainte)
 * - Cleanup date vechi
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { SavedSearchModule } from '../saved-search/saved-search.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SavedSearchModule,
    NotificationModule,
  ],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
