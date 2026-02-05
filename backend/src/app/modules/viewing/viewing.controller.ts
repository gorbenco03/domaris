/**
 * 📅 VIEWING CONTROLLER - Viewing Requests & Scheduling
 *
 * All viewing operations require only authentication (no KYC verification).
 */

import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ViewingService } from './viewing.service.js';
import {
  CurrentUserId,
} from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';

@ApiTags('viewings')
@Controller('viewings')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ViewingController {
  constructor(private readonly viewingService: ViewingService) {}

  // ============================================================================
  // LIST VIEWINGS
  // ============================================================================

  @Get()
  @ApiOperation({
    summary: 'Get my viewings',
    description: 'Get all viewings where user is involved (as property owner or as requester)',
  })
  @ApiResponse({ status: 200, description: 'List of viewings' })
  async getViewings(
    @CurrentUserId() userId: number,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.viewingService.getViewings(userId, {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming viewings' })
  async getUpcomingViewings(@CurrentUserId() userId: number) {
    return this.viewingService.getUpcomingViewings(userId);
  }

  // ============================================================================
  // AVAILABILITY
  // ============================================================================

  @Get('availability/:propertyId')
  @ApiOperation({
    summary: 'Get available viewing slots for a property',
    description: 'Returns available dates and time slots for the next 30 days.',
  })
  @ApiResponse({ status: 200, description: 'Available dates and slots' })
  async getAvailability(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.viewingService.getAvailability(propertyId, startDate, endDate);
  }

  // ============================================================================
  // VIEWING DETAILS
  // ============================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Get viewing details' })
  @ApiResponse({ status: 200, description: 'Viewing details' })
  async getViewing(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) viewingId: number,
  ) {
    return this.viewingService.getViewing(userId, viewingId);
  }

  // ============================================================================
  // REQUEST VIEWING
  // ============================================================================

  @Post()
  @ApiOperation({
    summary: 'Request a viewing',
    description: 'Requires authentication',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['propertyId', 'slot'],
      properties: {
        propertyId: { type: 'integer', description: 'Property to view' },
        slot: { type: 'string', format: 'date-time', description: 'Preferred date/time' },
        notes: { type: 'string', description: 'Additional notes for owner' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Viewing request created' })
  async requestViewing(
    @CurrentUserId() userId: number,
    @Body('propertyId') propertyId: number,
    @Body('slot') slot: string,
    @Body('notes') notes?: string,
  ) {
    return this.viewingService.requestViewing(userId, propertyId, slot, notes);
  }

  // ============================================================================
  // UPDATE VIEWING STATUS
  // ============================================================================

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Accept/Reject/Cancel viewing',
    description: 'Owner can accept/reject. Seeker can cancel.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
        },
        reason: { type: 'string', description: 'Reason for rejection/cancellation' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) viewingId: number,
    @Body('status') status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED',
    @Body('reason') reason?: string,
  ) {
    return this.viewingService.updateStatus(userId, viewingId, status, reason);
  }

  // ============================================================================
  // RESCHEDULE
  // ============================================================================

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule viewing' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['newSlot'],
      properties: {
        newSlot: { type: 'string', format: 'date-time' },
        reason: { type: 'string' },
      },
    },
  })
  async reschedule(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) viewingId: number,
    @Body('newSlot') newSlot: string,
    @Body('reason') reason?: string,
  ) {
    return this.viewingService.reschedule(userId, viewingId, newSlot, reason);
  }

  // ============================================================================
  // FEEDBACK (after viewing is completed)
  // ============================================================================

  @Post(':id/feedback')
  @ApiOperation({ summary: 'Submit feedback after viewing' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rating'],
      properties: {
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        comment: { type: 'string' },
        interested: { type: 'boolean', description: 'Still interested in property' },
      },
    },
  })
  async submitFeedback(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) viewingId: number,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
    @Body('interested') interested?: boolean,
  ) {
    return this.viewingService.submitFeedback(
      userId,
      viewingId,
      rating,
      comment,
      interested,
    );
  }
}
