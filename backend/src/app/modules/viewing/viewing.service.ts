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
import { ListingImage } from '../../db/entities/listingImage.entity';
import { User } from '../../db/entities/user.entity';
import { Op } from 'sequelize';
import { format, addMinutes } from 'date-fns';
import { NotificationService } from '../notification/notification.service';

interface GetViewingsParams {
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ViewingService {
  constructor(private readonly notificationService: NotificationService) {}
  // ============================================================================
  // LIST VIEWINGS
  // ============================================================================

  async getViewings(userId: number, params: GetViewingsParams = {}) {
    const { status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // Get all viewings where user is involved:
    // 1. As requester (viewings requested by user)
    // 2. As property owner (viewings for properties owned by user)
    
    // First, get viewings where user is the requester
    const requesterWhere: any = { seekerId: userId };
    if (status) requesterWhere.status = status;

    const requesterViewings = await Viewing.findAll({
      where: requesterWhere,
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId'],
          required: true,
          include: [
            {
              model: ListingImage,
              as: 'images',
              attributes: ['id', 'url', 'order'],
              limit: 1,
              order: [['order', 'ASC']],
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone', 'verificationLevel'],
            },
          ],
        },
        {
          model: User,
          as: 'seeker',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'],
        },
      ],
      order: [['slot', 'DESC']],
    });

    // Second, get viewings where user is owner of the property
    const ownerWhere: any = {};
    if (status) ownerWhere.status = status;

    const ownerViewings = await Viewing.findAll({
      where: ownerWhere,
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId'],
          where: { ownerId: userId },
          required: true,
          include: [
            {
              model: ListingImage,
              as: 'images',
              attributes: ['id', 'url', 'order'],
              limit: 1,
              order: [['order', 'ASC']],
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone', 'verificationLevel'],
            },
          ],
        },
        {
          model: User,
          as: 'seeker',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'],
        },
      ],
      order: [['slot', 'DESC']],
    });

    // Combine both lists and remove duplicates
    const allViewings = [...requesterViewings, ...ownerViewings];
    const uniqueViewings = allViewings.filter((v, index, self) => 
      index === self.findIndex((t) => t.id === v.id)
    );

    // Sort by slot date (most recent first)
    uniqueViewings.sort((a, b) => {
      const dateA = new Date(a.slot).getTime();
      const dateB = new Date(b.slot).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const total = uniqueViewings.length;
    const paginatedViewings = uniqueViewings.slice(offset, offset + limit);

    return {
      data: paginatedViewings.map((v) => this.formatViewing(v, userId)),
      meta: { 
        page, 
        limit, 
        total, 
        hasMore: offset + limit < total 
      },
    };
  }

  async getUpcomingViewings(userId: number) {
    const now = new Date();

    // Get all upcoming viewings where user is involved (as requester or as property owner)
    const requesterViewings = await Viewing.findAll({
      where: {
        seekerId: userId,
        slot: { [Op.gte]: now },
        status: { [Op.in]: ['pending', 'accepted'] },
      },
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId'],
          include: [
            {
              model: ListingImage,
              as: 'images',
              attributes: ['id', 'url', 'order'],
              limit: 1,
              order: [['order', 'ASC']],
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone', 'verificationLevel'],
            },
          ],
        },
        {
          model: User,
          as: 'seeker',
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        },
      ],
      order: [['slot', 'ASC']],
      limit: 20,
    });

    // Get upcoming viewings where user is owner of the property
    const ownerViewings = await Viewing.findAll({
      where: {
        slot: { [Op.gte]: now },
        status: { [Op.in]: ['pending', 'accepted'] },
      },
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId'],
          where: { ownerId: userId },
          include: [
            {
              model: ListingImage,
              as: 'images',
              attributes: ['id', 'url', 'order'],
              limit: 1,
              order: [['order', 'ASC']],
            },
          ],
        },
        {
          model: User,
          as: 'seeker',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel'],
        },
      ],
      order: [['slot', 'ASC']],
      limit: 20,
    });

    // Combine and remove duplicates
    const allViewings = [...requesterViewings, ...ownerViewings];
    const uniqueViewings = allViewings.filter((v, index, self) => 
      index === self.findIndex((t) => t.id === v.id)
    );

    return uniqueViewings.map((v) => this.formatViewing(v, userId));
  }

  // ============================================================================
  // VIEWING DETAILS
  // ============================================================================

  async getViewing(userId: number, viewingId: number) {
    const viewing = await Viewing.findByPk(viewingId, {
      include: [
        {
          model: Listing,
          attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId'],
          include: [
            {
              model: ListingImage,
              as: 'images',
              attributes: ['id', 'url', 'order'],
              limit: 1,
              order: [['order', 'ASC']],
            },
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'avatar', 'phone', 'verificationLevel'],
            },
          ],
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
        status: { [Op.in]: ['pending', 'accepted'] },
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
      status: 'pending',
    });

    // Send notification to owner
    try {
      const seeker = await User.findByPk(seekerId, {
        attributes: ['firstName', 'lastName'],
      });
      const seekerName = seeker 
        ? `${seeker.firstName || ''} ${seeker.lastName || ''}`.trim() || 'Un utilizator'
        : 'Un utilizator';
      
      console.log(`[ViewingService] Sending notification to owner ${listing.ownerId} for viewing ${viewing.id}`);
      await this.notificationService.create(listing.ownerId, {
        type: 'viewing_requested',
        title: 'Cerere nouă de vizionare',
        body: `${seekerName} a solicitat o vizionare pentru ${listing.title || 'proprietatea ta'}`,
        metadata: {
          viewingId: viewing.id,
          propertyId: propertyId,
          seekerId: seekerId,
        },
      });
      console.log(`[ViewingService] Notification sent successfully to owner ${listing.ownerId}`);
    } catch (error) {
      // Log error but don't fail the request
      console.error('[ViewingService] Failed to send notification:', error);
    }

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

    // Map controller status to entity status (lowercase)
    const entityStatus = status === 'CONFIRMED' ? 'accepted' : status.toLowerCase() as 'pending' | 'accepted' | 'rejected' | 'cancelled';
    viewing.status = entityStatus;
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
    viewing.status = 'pending'; // Reset to pending for confirmation
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

    // Note: Backend doesn't have 'completed' status yet, so we'll allow feedback for accepted viewings
    // In the future, you might want to add a 'completed' status or check slot date
    if (viewing.status !== 'accepted' && viewing.status !== 'completed') {
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
  // AVAILABILITY
  // ============================================================================

  /**
   * Get available dates and time slots for a property
   * Returns available dates in the next 30 days and available time slots for each date
   */
  async getAvailability(propertyId: number, startDate?: string, endDate?: string) {
    const listing = await Listing.findByPk(propertyId);
    if (!listing) {
      throw new NotFoundException('Proprietate negăsită');
    }

    const now = new Date();
    const start = startDate ? new Date(startDate) : now;
    const end = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Get all existing viewings for this property (pending or accepted)
    const existingViewings = await Viewing.findAll({
      where: {
        propertyId,
        slot: {
          [Op.between]: [start, end],
        },
        status: { [Op.in]: ['pending', 'accepted'] },
      },
      attributes: ['slot'],
    });

    // Generate available dates (next 30 days, excluding past dates)
    const availableDates: string[] = [];
    const bookedSlots: Record<string, string[]> = {}; // date -> array of booked times

    // Mark booked slots
    existingViewings.forEach((viewing) => {
      const slotDate = new Date(viewing.slot);
      const dateStr = format(slotDate, 'yyyy-MM-dd');
      const timeStr = format(slotDate, 'HH:mm');
      
      if (!bookedSlots[dateStr]) {
        bookedSlots[dateStr] = [];
      }
      bookedSlots[dateStr].push(timeStr);
    });

    // Generate dates (next 30 days)
    const currentDate = new Date(start);
    while (currentDate <= end) {
      if (currentDate >= now) {
        availableDates.push(format(currentDate, 'yyyy-MM-dd'));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate available time slots for each date
    // Default: 9:00 - 18:00, every 30 minutes
    const defaultSlots: Array<{ startTime: string; endTime: string }> = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        defaultSlots.push({ startTime, endTime });
      }
    }

    // Build response with available slots per date
    const availability: Record<string, Array<{ startTime: string; endTime: string }>> = {};
    
    availableDates.forEach((dateStr) => {
      const bookedTimes = bookedSlots[dateStr] || [];
      // Filter out booked slots
      availability[dateStr] = defaultSlots.filter(
        (slot) => !bookedTimes.includes(slot.startTime)
      );
    });

    return {
      propertyId,
      availableDates,
      availability, // date -> available slots
      defaultDuration: 30, // minutes
    };
  }

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  private formatViewing(viewing: any, userId: number, detailed = false) {
    const isOwner = viewing.property?.ownerId === userId;
    const isSeeker = viewing.seekerId === userId;

    // Map backend status to mobile status
    // Backend: 'pending' | 'accepted' | 'rejected' | 'cancelled'
    // Mobile: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show'
    let status: string = viewing.status.toLowerCase();
    if (status === 'accepted') {
      status = 'confirmed';
    }

    // Convert slot (Date) to TimeSlot format
    const slotDate = new Date(viewing.slot);
    const slot: any = {
      date: format(slotDate, 'yyyy-MM-dd'),
      startTime: format(slotDate, 'HH:mm'),
      endTime: format(addMinutes(slotDate, 30), 'HH:mm'), // default 30 min duration
    };

    const result: any = {
      id: String(viewing.id),
      propertyId: String(viewing.propertyId),
      ownerId: String(viewing.property?.ownerId || ''),
      seekerId: String(viewing.seekerId),
      status,
      slot,
      requestedSlots: [slot], // For compatibility, use the slot as requested slot
      confirmedSlot: status === 'confirmed' ? slot : undefined,
      duration: 30, // default 30 minutes
      notes: viewing.notes,
      createdAt: viewing.createdAt,
      confirmedAt: status === 'confirmed' ? viewing.updatedAt : undefined,
      cancelledAt: status === 'cancelled' ? viewing.updatedAt : undefined,
      isOwner,
      property: viewing.property
        ? {
            id: String(viewing.property.id),
            title: viewing.property.title || 'Proprietate',
            address: viewing.property.addressText || '',
            imageUrl: viewing.property.images?.[0]?.url || undefined,
            price: viewing.property.priceEur || 0,
          }
        : null,
    };

    // Add seeker info (for owner view)
    if (isOwner && viewing.seeker) {
      result.seeker = {
        id: String(viewing.seeker.id),
        name: `${viewing.seeker.firstName || ''} ${viewing.seeker.lastName || ''}`.trim() || 'Utilizator',
        avatar: viewing.seeker.avatar || undefined,
        phone: detailed && status === 'confirmed' ? viewing.seeker.phone : undefined,
      };
    }

    // Add owner info (for seeker view)
    if (isSeeker && viewing.property?.owner) {
      const owner = viewing.property.owner;
      result.owner = {
        id: String(owner.id),
        name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Proprietar',
        avatar: owner.avatar || undefined,
        phone: detailed && status === 'confirmed' ? owner.phone : undefined,
      };
    }

    return result;
  }
}
