import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize'
import pg from 'pg'
import { Listing } from './entities/listing.entity';
import { GisNode } from './entities/gisNode.entity';
import { GroupSource } from './entities/groupSource.entity';
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
import { ConfigModule, ConfigService } from '@nestjs/config';

// Options default
pg.defaults.parseInt8 = true;

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
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
            GroupSource,
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
          ],
          synchronize: true,
          sync: { alter: true }, // Force alter to add missing columns
          logging: (sql: string) => {
            // Log only in development or if explicitly enabled
            if (
              process.env.DB_LOGGING === 'true' ||
              process.env.NODE_ENV !== 'production'
            ) {
              console.log('📊 [DB Query]', sql.substring(0, 200));
            }
          },
          // Enable SSL only for production (cloud databases like Neon, Supabase)
          // Disable SSL for local development (Docker PostgreSQL)
          ...(configService.get<string>('NODE_ENV') === 'production' && {
            ssl: true,
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized: false,
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