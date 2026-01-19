import { Injectable } from '@nestjs/common';
import { ListingView } from '../../db/entities/listing-view.entity.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { Viewing } from '../../db/entities/viewing.entity.js';
import { Conversation } from '../../db/entities/conversation.entity.js';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AnalyticsService {
    async trackView(listingId: number, viewerId?: number, ip?: string) {
        // Simple verification to prevent duplicate counting (e.g. from same IP within 1 hour) could be added here
        await ListingView.create({
            listingId,
            viewerId,
            ip,
        });
    }

    async getPropertyAnalytics(listingId: number, period: '7d' | '30d' | 'all') {
        let dateFilter = {};
        const now = new Date();
        if (period === '7d') {
            const past = new Date(); past.setDate(now.getDate() - 7);
            dateFilter = { createdAt: { [Op.gte]: past } };
        } else if (period === '30d') {
            const past = new Date(); past.setDate(now.getDate() - 30);
            dateFilter = { createdAt: { [Op.gte]: past } };
        }

        const views = await ListingView.count({
            where: { listingId, ...dateFilter },
        });

        // Mock chart data for now, or aggregate by day
        // Real implementation would use Sequelize.fn('date_trunc', ...)

        return {
            views,
            leads: 0, // Implement count of inquiries if Viewings/Chats linked
            period,
        };
    }

    async getOwnerSummary(ownerId: number) {
        const listings = await Listing.findAll({ where: { ownerId }, attributes: ['id'] });
        const listingIds = listings.map(l => l.id);

        if (listingIds.length === 0) {
            return { totalViews: 0, totalLeads: 0, activeListings: 0 };
        }

        const totalViews = await ListingView.count({
            where: { listingId: { [Op.in]: listingIds } }
        });

        const totalViewings = await Viewing.count({
            include: [{ model: Listing, where: { ownerId } }]
        });

        // const totalConversations = ...

        return {
            totalViews,
            totalLeads: totalViewings, // Simply usage of viewings as leads
            activeListings: listingIds.length,
            listingsPerformance: [] // detailed list per property
        };
    }
}
