import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { OpenAiService } from '../../services/openai.service';

@Module({
  controllers: [ListingController],
  providers: [ListingService, OpenAiService],
  exports: [ListingService]
})
export class ListingModule {}
