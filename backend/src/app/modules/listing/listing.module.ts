import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { OpenAiService } from '../../services/openai.service';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [GeocodingModule],
  controllers: [ListingController],
  providers: [ListingService, OpenAiService],
  exports: [ListingService]
})
export class ListingModule {}
