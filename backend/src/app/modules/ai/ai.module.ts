/**
 * 🤖 AI MODULE
 */

import { Module } from '@nestjs/common';
import { AIController } from './ai.controller.js';
import { AIService } from './ai.service.js';
import { SearchModule } from '../search/search.module.js';

@Module({
  imports: [SearchModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
