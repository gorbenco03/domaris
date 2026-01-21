/**
 * 📅 VIEWING SERVICE - Viewing Requests & Scheduling
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Viewing } from '../../db/entities/viewing.entity';
import { Listing } from '../../db/entities/listing.entity';
import { User } from '../../db/entities/user.entity';
import { Op } from 'sequelize';

interface GetViewingsParams {
  role?: 'seeker' | 'owner';
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ViewingService {
  // ============================================================================
  // LIST VIEWINGS
  // ============================================================================

  async getViewings(userId: number, params: GetViewingsParams = {}) {
    const { role, status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    if (role === 'owner') {
      // Get viewings for properties owned by user
      const { rows, count } = await Viewing.findAndCountAll({
        include: [
          {
            model: Listing,
            attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId', 'images'],
            where: { ownerId: userId },
          },
          {
            model: User,
            as: 'seeker',
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'],
          },
        ],
        where: status ? { status } : {},
        order: [['slot', 'DESC']],
        limit,
        offset,
      });

      return {
        data: rows.map((v) => this.formatViewing(v, userId)),
        meta: { page, limit, total: count, hasMore: offset + rows.length < count },
      };
    }

    // Get viewings requested by user (seeker)
    const where: any = { seekerId: userId };
    if (status) where.status = status;

    const { rows, count } = await Viewing.findAndCountAll({
      where,
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'priceEur', 'images', 'ownerId'],
        },
        {
          model: User,
          as: 'seeker',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
      ],
      order: [['slot', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows.map((v) => this.formatViewing(v, userId)),
      meta: { page, limit, total: count, hasMore: offset + rows.length < count },
    };
  }

  async getUpcomingViewings(userId: number) {
    const now = new Date();

    // Get upcoming viewings as seeker
    const asSeeker = await Viewing.findAll({
      where: {
        seekerId: userId,
        slot: { [Op.gte]: now },
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
      },
      include: [
        { model: Listing, attributes: ['id', 'title', 'addressText', 'images'] },
      ],
      order: [['slot', 'ASC']],
      limit: 5,
    });

    // Get upcoming viewings as owner
    const asOwner = await Viewing.findAll({
      where: {
        slot: { [Op.gte]: now },
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
      },
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'images', 'ownerId'],
          where: { ownerId: userId },
        },
        {
          model: User,
          as: 'seeker',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
      ],
      order: [['slot', 'ASC']],
      limit: 5,
    });

    return {
      asSeeker: asSeeker.map((v) => this.formatViewing(v, userId)),
      asOwner: asOwner.map((v) => this.formatViewing(v, userId)),
    };
  }

  // ============================================================================
  // VIEWING DETAILS
  // ============================================================================

  async getViewing(userId: number, viewingId: number) {
    const viewing = await Viewing.findByPk(viewingId, {
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'priceEur', 'images', 'ownerId'],
        },
        {
          model: User,
          as: 'seeker',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone', 'verificationLevel'],
        },
      ],
    });

    if (!viewing) {
      throw new NotFoundException('Vizionare negăsită');
    }

    const isOwner = viewing.property?.ownerId === userId;
    const isSeeker = viewing.seekerId === userId;

    if (!isOwner && !isSeeker) {
      throw new ForbiddenException('Acces interzis');
    }

    return this.formatViewing(viewing, userId, true);
  }

  // ============================================================================
  // REQUEST VIEWING
  // ============================================================================

  async requestViewing(
    seekerId: number,
    propertyId: number,
    slot: string,
    notes?: string,
  ) {
    const listing = await Listing.findByPk(propertyId);
    if (!listing) {
      throw new NotFoundException('Proprietate negăsită');
    }

    if (listing.ownerId === seekerId) {
      throw new BadRequestException('Nu poți solicita vizionare pentru proprietatea ta');
    }

    // Check if there's already a pending viewing
    const existingViewing = await Viewing.findOne({
      where: {
        propertyId,
        seekerId,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingViewing) {
      throw new BadRequestException('Ai deja o vizionare în așteptare pentru această proprietate');
    }

    const viewing = await Viewing.create({
      propertyId,
      seekerId,
      slot: new Date(slot),
      notes,
      status: 'PENDING',
    });

    // TODO: Send notification to owner

    return this.getViewing(seekerId, viewing.id);
  }

  // ============================================================================
  // UPDATE STATUS
  // ============================================================================

  async updateStatus(
    userId: number,
    viewingId: number,
    status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED',
    reason?: string,
  ) {
    const viewing = await Viewing.findByPk(viewingId, {
      include: [{ model: Listing }],
    });

    if (!viewing) {
      throw new NotFoundException('Vizionare negăsită');
    }

    const isOwner = viewing.property?.ownerId === userId;
    const isSeeker = viewing.seekerId === userId;

    if (!isOwner && !isSeeker) {
      throw new ForbiddenException('Acces interzis');
    }

    // Validation
    if (status === 'CANCELLED') {
      // Both can cancel
    } else if (status === 'CONFIRMED' || status === 'REJECTED') {
      if (!isOwner) {
        throw new ForbiddenException('Doar proprietarul poate confirma/respinge vizionarea');
      }
    }

    viewing.status = status;
    if (reason) {
      viewing.notes = `${viewing.notes || ''}\nMotiv: ${reason}`;
    }
    await viewing.save();

    // TODO: Send notification to other party

    return this.getViewing(userId, viewingId);
  }

  // ============================================================================
  // RESCHEDULE
  // ============================================================================

  async reschedule(userId: number, viewingId: number, newSlot: string, reason?: string) {
    const viewing = await Viewing.findByPk(viewingId, {
      include: [{ model: Listing }],
    });

    if (!viewing) {
      throw new NotFoundException('Vizionare negăsită');
    }

    const isOwner = viewing.property?.ownerId === userId;
    const isSeeker = viewing.seekerId === userId;

    if (!isOwner && !isSeeker) {
      throw new ForbiddenException('Acces interzis');
    }

    viewing.slot = new Date(newSlot);
    viewing.status = 'PENDING'; // Reset to pending for confirmation
    if (reason) {
      viewing.notes = `${viewing.notes || ''}\nReprogramat: ${reason}`;
    }
    await viewing.save();

    // TODO: Send notification

    return this.getViewing(userId, viewingId);
  }

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  async submitFeedback(
    userId: number,
    viewingId: number,
    rating: number,
    comment?: string,
    interested?: boolean,
  ) {
    const viewing = await Viewing.findByPk(viewingId, {
      include: [{ model: Listing }],
    });

    if (!viewing) {
      throw new NotFoundException('Vizionare negăsită');
    }

    if (viewing.seekerId !== userId) {
      throw new ForbiddenException('Doar solicitantul poate lăsa feedback');
    }

    if (viewing.status !== 'COMPLETED') {
      throw new BadRequestException('Feedback poate fi lăsat doar după finalizarea vizionării');
    }

    // TODO: Implement feedback storage (might need ViewingFeedback entity)
    // For now, store in notes
    viewing.notes = `${viewing.notes || ''}\nFeedback: ${rating}/5 - ${comment || 'Fără comentariu'}. Interesat: ${interested ? 'Da' : 'Nu'}`;
    await viewing.save();

    return {
      success: true,
      message: 'Feedback trimis cu succes',
    };
  }

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  private formatViewing(viewing: any, userId: number, detailed = false) {
    const isOwner = viewing.property?.ownerId === userId;

    const result: any = {
      id: viewing.id,
      slot: viewing.slot,
      status: viewing.status,
      notes: viewing.notes,
      createdAt: viewing.createdAt,
      isOwner,
      property: viewing.property
        ? {
            id: viewing.property.id,
            title: viewing.property.title,
            address: viewing.property.addressText,
            price: viewing.property.priceEur,
            image: viewing.property.images?.[0],
          }
        : null,
    };

    if (isOwner && viewing.seeker) {
      result.seeker = {
        id: viewing.seeker.id,
        firstName: viewing.seeker.firstName,
        lastName: viewing.seeker.lastName,
        avatar: viewing.seeker.avatar,
        isVerified: (viewing.seeker.verificationLevel || 0) >= 2,
      };

      if (detailed && viewing.status === 'CONFIRMED') {
        result.seeker.phone = viewing.seeker.phone;
      }
    }

    return result;
  }
}
