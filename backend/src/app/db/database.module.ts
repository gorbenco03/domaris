import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize'
import pg from 'pg'
import { Listing } from './entities/listing.entity';
import { FbPost } from './entities/fbPost.model';
import { FbPostImage } from './entities/fb-post-image.model';
import { GisNode } from './entities/gisNode.entity';
import { GroupSource } from './entities/groupSource.entity';
import { ListingImage } from './entities/listingImage.entity';
import { User } from './entities/user.entity';
import { UserOnboarding } from './entities/userOnboarding.entity';

// Options default
pg.defaults.parseInt8 = true;

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: async () => {
        return {
          dialect: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT ?? 5432),
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_NAME,
          autoLoadModels: true,
          models: [
            Listing,
            FbPost,
            FbPostImage,
            GisNode,
            GroupSource,
            ListingImage,
            User,
            UserOnboarding,
          ],
          synchronize: true,
          // synchronize: process.env.NODE_ENV !== 'development',
          logging: (sql: string) => {
            // Log only in development or if explicitly enabled
            if (
              process.env.DB_LOGGING === 'true' ||
              process.env.NODE_ENV !== 'production'
            ) {
              console.log('📊 [DB Query]', sql.substring(0, 200));
            }
          },
          // Enable SSL for Neon and other cloud databases
          ssl: true,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
        };
      },
    }),
  ],
  exports: [DatabaseModule],
})
export class DatabaseModule { }