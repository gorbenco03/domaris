/**
 * ⭐ REVIEW CONTROLLER - User Reviews API
 *
 * Endpoints:
 * - POST /reviews - Creează un review nou (după vizionare completată)
 * - GET /reviews/user/:userId - Obține review-urile unui utilizator
 * - GET /reviews/user/:userId/stats - Obține statisticile review-urilor
 * - GET /reviews/:id - Obține un review specific
 * - POST /reviews/:id/respond - Răspunde la un review
 * - POST /reviews/:id/helpful - Toggle helpful vote
 * - POST /reviews/:id/report - Raportează un review
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
import { ReviewService } from './review.service';
import { CurrentUserId, Public } from '../../core/decorators';
import { AuthGuard } from '../../auth/auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ============================================================================
  // CREATE REVIEW
  // ============================================================================

  @UseGuards(AuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review after completed viewing' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['viewingId', 'rating'],
      properties: {
        viewingId: { type: 'integer', description: 'ID of the completed viewing' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        title: { type: 'string', maxLength: 100 },
        comment: { type: 'string', maxLength: 500 },
        interested: { type: 'boolean', description: 'Still interested in property' },
        transactionType: {
          type: 'string',
          enum: ['buyer', 'seller', 'renter', 'landlord'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or already reviewed' })
  async createReview(
    @CurrentUserId() userId: number,
    @Body('viewingId') viewingId: number,
    @Body('rating') rating: number,
    @Body('title') title?: string,
    @Body('comment') comment?: string,
    @Body('interested') interested?: boolean,
    @Body('transactionType') transactionType?: 'buyer' | 'seller' | 'renter' | 'landlord',
  ) {
    return this.reviewService.createReview(userId, {
      viewingId,
      rating,
      title,
      comment,
      interested,
      transactionType,
    });
  }

  // ============================================================================
  // GET USER REVIEWS
  // ============================================================================

  @Public()
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews for a user' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getUserReviews(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
  ) {
    return this.reviewService.getUserReviews({
      userId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
    });
  }

  @Public()
  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get review statistics for a user' })
  @ApiResponse({ status: 200, description: 'Review statistics' })
  async getUserReviewStats(@Param('userId', ParseIntPipe) userId: number) {
    return this.reviewService.getUserReviewStats(userId);
  }

  // ============================================================================
  // GET SINGLE REVIEW
  // ============================================================================

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single review' })
  @ApiResponse({ status: 200, description: 'Review details' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getReview(id);
  }

  // ============================================================================
  // RESPOND TO REVIEW
  // ============================================================================

  @UseGuards(AuthGuard)
  @Post(':id/respond')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a review (recipient only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['response'],
      properties: {
        response: { type: 'string', maxLength: 500 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to respond' })
  async respondToReview(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) reviewId: number,
    @Body('response') response: string,
  ) {
    return this.reviewService.respondToReview(userId, reviewId, response);
  }

  // ============================================================================
  // HELPFUL VOTE
  // ============================================================================

  @UseGuards(AuthGuard)
  @Post(':id/helpful')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle helpful vote on a review' })
  @ApiResponse({ status: 200, description: 'Vote toggled' })
  async toggleHelpful(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) reviewId: number,
  ) {
    return this.reviewService.toggleHelpful(userId, reviewId);
  }

  // ============================================================================
  // REPORT REVIEW
  // ============================================================================

  @UseGuards(AuthGuard)
  @Post(':id/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a review' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: { type: 'string', description: 'Reason for reporting' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Review reported' })
  async reportReview(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) reviewId: number,
    @Body('reason') reason: string,
  ) {
    return this.reviewService.reportReview(userId, reviewId, reason);
  }
}
