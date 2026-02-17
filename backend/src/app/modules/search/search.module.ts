import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MonetizationModule } from '../monetization/monetization.module.js';

@Module({
    imports: [MonetizationModule],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService], // Export pentru alte module (SavedSearch, AI, Cron)
})
export class SearchModule { }

