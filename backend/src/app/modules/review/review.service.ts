/**
 * ⭐ REVIEW SERVICE - User Reviews Management
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Review } from '../../db/entities/review.entity';
import { User } from '../../db/entities/user.entity';
import { Viewing } from '../../db/entities/viewing.entity';
import { Listing } from '../../db/entities/listing.entity';
import { NotificationService } from '../notification/notification.service';
import { Op, Sequelize } from 'sequelize';

interface CreateReviewDto {
  viewingId: number;
  rating: number;
  title?: string;
  comment?: string;
  interested?: boolean;
  transactionType?: 'buyer' | 'seller' | 'renter' | 'landlord';
}

interface GetReviewsParams {
  userId: number;
  page?: number;
  limit?: number;
  minRating?: number;
  maxRating?: number;
}

@Injectable()
export class ReviewService {
  constructor(private readonly notificationService: NotificationService) {}

  // ============================================================================
  // CREATE REVIEW
  // ============================================================================

  /**
   * Creează un review nou după o vizionare completată
   */
  async createReview(authorId: number, dto: CreateReviewDto) {
    const viewing = await Viewing.findByPk(dto.viewingId, {
      include: [{ model: Listing }],
    });

    if (!viewing) {
      throw new NotFoundException('Vizionarea nu a fost găsită');
    }

    // Verifică dacă vizionarea este completată
    if (viewing.status !== 'completed') {
      throw new BadRequestException('Poți lăsa un review doar după ce vizionarea a fost finalizată');
    }

    // Determină tipul review-ului și recipient-ul
    const isSeeker = viewing.seekerId === authorId;
    const isOwner = viewing.property?.ownerId === authorId;

    if (!isSeeker && !isOwner) {
      throw new ForbiddenException('Nu ai permisiunea să lași un review pentru această vizionare');
    }

    const type = isSeeker ? 'seeker_to_owner' : 'owner_to_seeker';
    const recipientId = isSeeker ? viewing.property!.ownerId : viewing.seekerId;

    // Verifică dacă există deja un review de acest tip pentru această vizionare
    const existingReview = await Review.findOne({
      where: {
        viewingId: dto.viewingId,
        authorId,
        type,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Ai lăsat deja un review pentru această vizionare');
    }

    // Creează review-ul
    const review = await Review.create({
      viewingId: dto.viewingId,
      authorId,
      recipientId,
      listingId: viewing.propertyId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      type,
      transactionType: dto.transactionType,
      interested: dto.interested ?? true,
    });

    // Actualizează rating-ul utilizatorului recipient
    await this.updateUserRating(recipientId);

    // Trimite notificare către recipient
    const author = await User.findByPk(authorId, { attributes: ['firstName', 'lastName'] });
    const authorName = author
      ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Cineva'
      : 'Cineva';

    await this.notificationService.create(recipientId, {
      type: 'new_review',
      title: '⭐ Ai primit un review nou',
      body: `${authorName} ți-a lăsat un review de ${dto.rating} stele`,
      metadata: {
        reviewId: review.id,
        viewingId: dto.viewingId,
        rating: dto.rating,
      },
    });

    return this.formatReview(review);
  }

  // ============================================================================
  // GET REVIEWS
  // ============================================================================

  /**
   * Obține review-urile pentru un utilizator
   */
  async getUserReviews(params: GetReviewsParams) {
    const { userId, page = 1, limit = 20, minRating, maxRating } = params;
    const offset = (page - 1) * limit;

    const where: any = {
      recipientId: userId,
      isVisible: true,
    };

    if (minRating !== undefined) {
      where.rating = { ...where.rating, [Op.gte]: minRating };
    }
    if (maxRating !== undefined) {
      where.rating = { ...where.rating, [Op.lte]: maxRating };
    }

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'],
        },
        {
          model: Listing,
          attributes: ['id', 'title'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: reviews.map((r) => this.formatReview(r)),
      meta: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Obține statisticile review-urilor pentru un utilizator
   */
  async getUserReviewStats(userId: number) {
    const reviews = await Review.findAll({
      where: {
        recipientId: userId,
        isVisible: true,
      },
      attributes: ['rating'],
    });

    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        responseRate: 0,
      };
    }

    // Calculează distribuția
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const review of reviews) {
      sum += review.rating;
      distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
    }

    // Calculează rata de răspuns
    const reviewsWithResponses = await Review.count({
      where: {
        recipientId: userId,
        isVisible: true,
        ownerResponse: { [Op.ne]: null },
      },
    });

    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      total: reviews.length,
      distribution,
      responseRate: Math.round((reviewsWithResponses / reviews.length) * 100),
    };
  }

  /**
   * Obține un review specific
   */
  async getReview(reviewId: number) {
    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Listing,
          attributes: ['id', 'title'],
        },
      ],
    });

    if (!review) {
      throw new NotFoundException('Review-ul nu a fost găsit');
    }

    return this.formatReview(review);
  }

  // ============================================================================
  // OWNER RESPONSE
  // ============================================================================

  /**
   * Permite recipient-ului să răspundă la un review
   */
  async respondToReview(userId: number, reviewId: number, response: string) {
    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new NotFoundException('Review-ul nu a fost găsit');
    }

    if (review.recipientId !== userId) {
      throw new ForbiddenException('Nu poți răspunde la acest review');
    }

    if (review.ownerResponse) {
      throw new BadRequestException('Ai răspuns deja la acest review');
    }

    review.ownerResponse = response;
    review.ownerRespondedAt = new Date();
    await review.save();

    // Notifică autorul review-ului
    await this.notificationService.create(review.authorId, {
      type: 'review_response',
      title: '💬 Răspuns la review-ul tău',
      body: 'Ai primit un răspuns la review-ul pe care l-ai lăsat',
      metadata: { reviewId: review.id },
    });

    return this.formatReview(review);
  }

  // ============================================================================
  // HELPFUL VOTES
  // ============================================================================

  /**
   * Marchează un review ca util
   */
  async toggleHelpful(userId: number, reviewId: number) {
    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new NotFoundException('Review-ul nu a fost găsit');
    }

    const userIds = review.helpfulByUserIds || [];
    const isHelpful = userIds.includes(userId);

    if (isHelpful) {
      // Remove vote
      review.helpfulByUserIds = userIds.filter((id) => id !== userId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add vote
      review.helpfulByUserIds = [...userIds, userId];
      review.helpfulCount = review.helpfulCount + 1;
    }

    await review.save();

    return {
      helpful: review.helpfulCount,
      isHelpful: !isHelpful,
    };
  }

  // ============================================================================
  // REPORT
  // ============================================================================

  /**
   * Raportează un review
   */
  async reportReview(userId: number, reviewId: number, reason: string) {
    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new NotFoundException('Review-ul nu a fost găsit');
    }

    review.isReported = true;
    review.reportReason = reason;
    await review.save();

    return { success: true, message: 'Review-ul a fost raportat' };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Actualizează rating-ul agregat al unui utilizator
   */
  private async updateUserRating(userId: number) {
    const result = await Review.findOne({
      where: {
        recipientId: userId,
        isVisible: true,
      },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      raw: true,
    }) as any;

    const avgRating = parseFloat(result?.avgRating || '0');
    const count = parseInt(result?.count || '0', 10);

    await User.update(
      {
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: count,
      },
      { where: { id: userId } },
    );
  }

  /**
   * Formatează un review pentru răspunsul API
   */
  private formatReview(review: Review) {
    const author = review.author;
    const listing = review.listing;

    return {
      id: String(review.id),
      author: author
        ? {
            id: String(author.id),
            name: `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Utilizator',
            avatar: author.avatar,
            isVerified: author.verificationLevel >= 2,
          }
        : null,
      rating: review.rating,
      title: review.title,
      content: review.comment,
      date: review.createdAt?.toISOString().split('T')[0],
      helpful: review.helpfulCount,
      transactionType: review.type === 'seeker_to_owner' ? 'renter' : 'landlord',
      propertyTitle: listing?.title,
      interested: review.interested,
      response: review.ownerResponse
        ? {
            content: review.ownerResponse,
            date: review.ownerRespondedAt?.toISOString().split('T')[0],
          }
        : undefined,
    };
  }
}
