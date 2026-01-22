/**
 * 🔖 SAVED SEARCHES MODULE
 */

import { Module } from '@nestjs/common';
import { SavedSearchController } from './saved-search.controller.js';
import { SavedSearchService } from './saved-search.service.js';
import { SearchModule } from '../search/search.module.js';

@Module({
  imports: [SearchModule],
  controllers: [SavedSearchController],
  providers: [SavedSearchService],
  exports: [SavedSearchService],
})
export class SavedSearchModule {}
