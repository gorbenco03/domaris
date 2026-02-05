/**
 * AI MODULE - AI Gateway & Orchestration Layer
 *
 * Architecture:
 * - AIGatewayService: Central orchestration (routing, tools, state)
 * - AiConversationService: Persistent conversation management
 * - IntentRouter: Multi-tier routing (Tier 0/1/2)
 * - ToolExecutor: Secure tool execution (with real ViewingService)
 * - ValuationEngine: AVM price recommendations
 * - AIService: Legacy service (maintained for backward compatibility)
 */

import { Module } from '@nestjs/common';
import { AIController } from './ai.controller.js';
import { AIService } from './ai.service.js';
import { AIGatewayService } from './gateway/ai-gateway.service.js';
import { AiConversationService } from './conversation/ai-conversation.service.js';
import { IntentRouter } from './router/intent-router.js';
import { ToolExecutor } from './tools/executor.js';
import { ValuationEngine } from './avm/valuation-engine.js';
import { SearchModule } from '../search/search.module.js';
import { ViewingModule } from '../viewing/viewing.module.js';

@Module({
  imports: [SearchModule, ViewingModule],
  controllers: [AIController],
  providers: [
    AIService,
    AIGatewayService,
    AiConversationService,
    IntentRouter,
    ToolExecutor,
    ValuationEngine,
  ],
  exports: [AIService, AIGatewayService, AiConversationService, ValuationEngine],
})
export class AIModule {}
