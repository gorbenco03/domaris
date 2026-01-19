import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './db/database.module.js';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter } from './core/exception.filter';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './core/redis.module';
import { UserService } from './modules/user/user.service';
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

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // AuthModule.forRoot({
    //   isGlobal: true,
    //   secret: process.env.JWT_SECRET!,
    //   expiresIn: 86400, // 24 hours in seconds (24 * 60 * 60)
    //   refreshExpiresIn: 2678400, // 31 days in seconds (31 * 24 * 60 * 60)
    //   audience: 'mobile',
    //   type: 'user',
    // }),
    // RedisModule,
    DatabaseModule,
    ListingModule,
    KycModule,
    SearchModule,
    ChatModule,
    ViewingModule,
    FavoriteModule,
    NotificationModule,
    AnalyticsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule { }
