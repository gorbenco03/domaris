import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize'
import pg from 'pg'
import { Listing } from './entities/listing.entity';
import { GisNode } from './entities/gisNode.entity';

import { ListingImage } from './entities/listingImage.entity';
import { User } from './entities/user.entity';
import { UserOnboarding } from './entities/userOnboarding.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Viewing } from './entities/viewing.entity';
import { Favorite } from './entities/favorite.entity.js';
import { Notification } from './entities/notification.entity.js';
import { Device } from './entities/device.entity.js';
import { ListingView } from './entities/listing-view.entity.js';
import { SavedSearch } from './entities/saved-search.entity.js';
import { KycVerification } from './entities/kyc-verification.entity.js';
import { KycDocument } from './entities/kyc-document.entity.js';
import { SubscriptionPlan } from './entities/subscription-plan.entity.js';
import { UserSubscription } from './entities/user-subscription.entity.js';
import { PromotionPlan } from './entities/promotion-plan.entity.js';
import { ListingPromotion } from './entities/listing-promotion.entity.js';
import { Transaction } from './entities/transaction.entity.js';
import { Review } from './entities/review.entity.js';
import { AdminAuditLog } from './entities/admin-audit-log.entity.js';
import { UserConsent } from './entities/user-consent.entity.js';
import { AiConversation } from './entities/ai-conversation.entity.js';
import { AiMessage } from './entities/ai-message.entity.js';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Options default
pg.defaults.parseInt8 = true;

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const shouldSynchronize = configService.get<boolean>('DB_SYNCHRONIZE') ?? !isProduction;
        const useSsl = configService.get<boolean>('DB_SSL') ?? isProduction;
        const rejectUnauthorized = configService.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED') ?? false;

        return {
          dialect: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<number>('DB_PORT') ?? 5432),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASS'),
          database: configService.get<string>('DB_NAME'),
          autoLoadModels: true,
          models: [
            Listing,
            GisNode,

            ListingImage,
            User,
            UserOnboarding,
            Conversation,
            Message,
            Viewing,
            Favorite,
            Notification,
            Device,
            ListingView,
            SavedSearch,
            KycVerification,
            KycDocument,
            // Monetization entities
            SubscriptionPlan,
            UserSubscription,
            PromotionPlan,
            ListingPromotion,
            Transaction,
            // Reviews
            Review,
            // Admin audit logs
            AdminAuditLog,
            // GDPR consent tracking
            UserConsent,
            // AI conversations
            AiConversation,
            AiMessage,
          ],
          synchronize: shouldSynchronize,
          ...(shouldSynchronize && {
            sync: {
              alter: !isProduction,
            },
          }),
          logging: (sql: string) => {
            if (configService.get<boolean>('DB_LOGGING')) {
              console.log('📊 [DB Query]', sql.substring(0, 200));
            }
          },
          ...(useSsl && {
            ssl: true,
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized,
              },
            },
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [DatabaseModule],
})
export class DatabaseModule { }