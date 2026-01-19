import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Viewing } from '../../db/entities/viewing.entity';
import { Listing } from '../../db/entities/listing.entity';
import { User } from '../../db/entities/user.entity';
import { Op } from 'sequelize';

@Injectable()
export class ViewingService {
    async getViewings(userId: number, role: 'seeker' | 'owner' = 'seeker') {
        const where: any = {};
        if (role === 'seeker') {
            where.seekerId = userId;
        } else {
            // Find viewings where property.ownerId = userId
            // This is complex in simple where, better to join Listing
        }

        const include: any[] = [
            { model: Listing, attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId'] },
            { model: User, as: 'seeker', attributes: ['id', 'firstName', 'lastName'] }
        ];

        if (role === 'owner') {
            // We need to filter by listings owned by user
            // Creating a subquery or checking listing.ownerId
            // Sequelize approach:
            return Viewing.findAll({
                include: [
                    {
                        model: Listing,
                        attributes: ['id', 'title', 'addressText', 'priceEur', 'ownerId'],
                        where: { ownerId: userId }
                    },
                    { model: User, as: 'seeker', attributes: ['id', 'firstName', 'lastName'] }
                ],
                order: [['slot', 'ASC']]
            });
        }

        return Viewing.findAll({
            where: { seekerId: userId },
            include: [
                { model: Listing, attributes: ['id', 'title', 'addressText', 'priceEur'] }
            ],
            order: [['slot', 'ASC']]
        });
    }

    async requestViewing(seekerId: number, propertyId: number, slot: string, notes?: string) {
        const listing = await Listing.findByPk(propertyId);
        if (!listing) throw new NotFoundException('Property not found');

        if (String(listing.ownerId) === String(seekerId)) {
            throw new BadRequestException('Cannot request viewing for own property');
        }

        return Viewing.create({
            propertyId,
            seekerId,
            slot: new Date(slot),
            notes,
            status: 'pending'
        });
    }

    async updateStatus(userId: number, viewingId: number, status: 'accepted' | 'rejected' | 'cancelled') {
        const viewing = await Viewing.findByPk(viewingId, { include: [Listing] });
        if (!viewing) throw new NotFoundException('Viewing not found');

        const isOwner = String(viewing.property.ownerId) === String(userId);
        const isSeeker = String(viewing.seekerId) === String(userId);

        if (!isOwner && !isSeeker) throw new ForbiddenException('Access denied');

        if (status === 'cancelled') {
            // Both can cancel
        } else {
            // Only owner can accept/reject
            if (!isOwner) throw new ForbiddenException('Only owner can accept/reject');
        }

        viewing.status = status;
        await viewing.save();
        return viewing;
    }
}
