/**
 * 📅 VIEWING CONTROLLER - Viewing Requests & Scheduling
 *
 * Conform ADR-001: Model de Cont Unificat
 * - Cerere vizionare necesită Level 1 (email/phone verified)
 * - Accept/Reject necesită Level 2 pentru owner (are proprietate deci e verificat)
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
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ViewingService } from './viewing.service.js';
import {
  CurrentUserId,
  MinVerificationLevel,
} from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';
import { VerificationGuard } from '../../core/verification.guard';

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
    description: 'Get viewings as seeker (my requests) or as owner (requests for my properties)',
  })
  @ApiResponse({ status: 200, description: 'List of viewings' })
  async getViewings(
    @CurrentUserId() userId: number,
    @Query('role') role?: 'seeker' | 'owner',
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.viewingService.getViewings(userId, {
      role,
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
  // REQUEST VIEWING (requires Level 1)
  // ============================================================================

  @UseGuards(VerificationGuard)
  @MinVerificationLevel(1)
  @Post()
  @ApiOperation({
    summary: 'Request a viewing',
    description: 'Requires email/phone verification (Level 1)',
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
  @ApiForbiddenResponse({ description: 'Email/phone verification required' })
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
