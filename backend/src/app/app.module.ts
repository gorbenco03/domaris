import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './db/database.module';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter } from './core/exception.filter';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './core/redis.module';
import { UserService } from './modules/user/user.service';
import { ListingModule } from './modules/listing/listing.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    // AuthModule.forRoot({
    //   isGlobal: true,
    //   secret: process.env.JWT_SECRET!,
    //   expiresIn: 86400, // 24 hours in seconds (24 * 60 * 60)
    //   refreshExpiresIn: 2678400, // 31 days in seconds (31 * 24 * 60 * 60)
    //   audience: 'mobile',
    //   type: 'user',
    // }),
    // RedisModule,
    ListingModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
