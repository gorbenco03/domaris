/**
 * 💬 CHAT MODULE - Messaging & Real-time Communication
 * 
 * Includes:
 * - ChatController: REST API for conversations
 * - ChatService: Business logic for messaging
 * - ChatGateway: WebSocket for real-time messaging
 */

import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
