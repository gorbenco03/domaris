/**
 * 🏠 APP MODULE - Modulul principal al aplicației
 *
 * Configurare conform ADR-001: Model de Cont Unificat
 * - AuthModule pentru autentificare JWT
 * - RedisModule pentru sesiuni și OTP
 * - Toate modulele de feature
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SequelizeModule } from '@nestjs/sequelize';

import { AppController } from './app.controller';
import { AppExceptionFilter } from './core/exception.filter';

// Core Modules
import { DatabaseModule } from './db/database.module.js';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './core/redis.module';
import { MessagingModule } from './core/messaging.module';
import { AuditModule } from './core/audit/audit.module.js';
import { ConsentModule } from './core/consent/consent.module.js';

// Feature Modules
import { ListingModule } from './modules/listing/listing.module.js';
import { KycModule } from './modules/kyc/kyc.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { ChatModule } from './modules/chat/chat.module';
import { ViewingModule } from './modules/viewing/viewing.module';
import { FavoriteModule } from './modules/favorite/favorite.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { S3Module } from './s3/s3.module';
import { UserModule } from './modules/user/user.module.js';
import { SavedSearchModule } from './modules/saved-search/saved-search.module.js';
import { AIModule } from './modules/ai/ai.module.js';
import { CronModule } from './modules/cron/cron.module.js';
import { MonetizationModule } from './modules/monetization/monetization.module.js';
import { ReviewModule } from './modules/review/review.module.js';
import { RentalContractModule } from './modules/rental-contract/rental-contract.module.js';

@Module({
  imports: [
    // Config - must be first
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting — global default: 60 req/min per IP
    // Auth and AI endpoints get tighter limits via @Throttle() decorator
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,  // 1 minute window
        limit: 60,   // 60 requests per window
      },
      {
        name: 'auth',
        ttl: 60000,  // 1 minute window
        limit: 10,   // 10 auth attempts per window
      },
    ]),

    // Messaging - Email & SMS (global)
    MessagingModule,

    // Audit - Admin action logging (global)
    AuditModule,

    // Consent - GDPR consent tracking (global)
    ConsentModule,

    // Redis - for sessions, OTP, caching
    RedisModule,

    // Auth - JWT authentication (global guard)
    AuthModule.forRoot({
      isGlobal: true,
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      expiresIn: 86400, // 24 hours in seconds
      refreshExpiresIn: 2678400, // 31 days in seconds
      audience: 'domaris',
      type: 'user',
    }),

    // Database
    DatabaseModule,
    // Needed by AppController for @InjectConnection() in health check
    SequelizeModule.forFeature([]),

    // Feature Modules
    UserModule,
    ListingModule,
    KycModule,
    SearchModule,
    ChatModule,
    ViewingModule,
    FavoriteModule,
    NotificationModule,
    AnalyticsModule,
    AdminModule,
    S3Module,
    SavedSearchModule,
    AIModule,
    CronModule,
    MonetizationModule,
    ReviewModule,
    RentalContractModule,
  ],
  controllers: [AppController],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    // Global rate-limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
