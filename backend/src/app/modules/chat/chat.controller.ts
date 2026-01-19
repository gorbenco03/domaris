import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthOnly, CurrentUser } from '../../core/decorators.js';

@ApiTags('chat')
@Controller('conversations')
@AuthOnly()
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get()
    @ApiOperation({ summary: 'Get my conversations' })
    async getConversations(@CurrentUser() user: any) {
        return this.chatService.getUserConversations(user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Start or get existing conversation' })
    async startConversation(
        @CurrentUser() user: any,
        @Body('propertyId') propertyId: number,
        @Body('message') message?: string
    ) {
        return this.chatService.startConversation(user.id, propertyId, message);
    }

    @Get(':id/messages')
    @ApiOperation({ summary: 'Get messages in conversation' })
    async getMessages(
        @CurrentUser() user: any,
        @Param('id') conversationId: number
    ) {
        return this.chatService.getMessages(user.id, conversationId);
    }

    @Post(':id/messages')
    @ApiOperation({ summary: 'Send message' })
    async sendMessage(
        @CurrentUser() user: any,
        @Param('id') conversationId: number,
        @Body('content') content: string
    ) {
        return this.chatService.sendMessage(user.id, conversationId, content);
    }
}
