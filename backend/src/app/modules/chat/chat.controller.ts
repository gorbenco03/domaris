/**
 * 💬 CHAT CONTROLLER - Messaging/Conversations
 *
 * All messaging requires only authentication (no KYC verification).
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
  CurrentUser,
  CurrentUserId,
} from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ============================================================================
  // CONVERSATION LIST
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get my conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(
    @CurrentUserId() userId: number,
    @Query('type') type?: 'all' | 'unread' | 'archived',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getUserConversations(userId, {
      type: type || 'all',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread messages count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUserId() userId: number) {
    return this.chatService.getUnreadCount(userId);
  }

  // ============================================================================
  // CONVERSATION DETAILS
  // ============================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  async getConversation(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.getConversation(userId, conversationId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in conversation' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(userId, conversationId, {
      before: before ? new Date(before) : undefined,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  // ============================================================================
  // START CONVERSATION
  // ============================================================================

  @Post()
  @ApiOperation({
    summary: 'Start or get existing conversation',
    description: 'Requires authentication',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['propertyId'],
      properties: {
        propertyId: { type: 'integer', description: 'Property to inquire about' },
        message: { type: 'string', description: 'Initial message (optional)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Conversation created/retrieved' })
  async startConversation(
    @CurrentUserId() userId: number,
    @Body('propertyId') propertyId: number,
    @Body('message') message?: string,
  ) {
    return this.chatService.startConversation(userId, propertyId, message);
  }

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  @Post(':id/messages')
  @ApiOperation({
    summary: 'Send message',
    description: 'Requires authentication',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: { type: 'string', description: 'Message content' },
        type: {
          type: 'string',
          enum: ['TEXT', 'IMAGE', 'VIEWING_REQUEST'],
          default: 'TEXT',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Message sent' })
  async sendMessage(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body('content') content: string,
    @Body('type') type?: string,
  ) {
    return this.chatService.sendMessage(userId, conversationId, content, type);
  }

  // ============================================================================
  // CONVERSATION ACTIONS
  // ============================================================================

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markAsRead(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.markAsRead(userId, conversationId);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive conversation' })
  async archiveConversation(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.archiveConversation(userId, conversationId);
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive conversation' })
  async unarchiveConversation(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.unarchiveConversation(userId, conversationId);
  }
}
