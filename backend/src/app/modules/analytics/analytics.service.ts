import { Injectable } from '@nestjs/common';
import { ListingView } from '../../db/entities/listing-view.entity.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { Viewing } from '../../db/entities/viewing.entity.js';
import { Conversation } from '../../db/entities/conversation.entity.js';
import { Favorite } from '../../db/entities/favorite.entity.js';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AnalyticsService {
    async trackView(
        listingId: number,
        viewerId?: number,
        anonymousId?: string,
        ip?: string,
    ) {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const dedupeWhere: Record<string, any> = { listingId, createdAt: { [Op.gte]: cutoff } };
        if (viewerId) {
            dedupeWhere.viewerId = viewerId;
        } else if (anonymousId) {
            dedupeWhere.anonymousId = anonymousId;
        } else if (ip) {
            dedupeWhere.ip = ip;
        }

        if (dedupeWhere.viewerId || dedupeWhere.anonymousId || dedupeWhere.ip) {
            const existing = await ListingView.findOne({
                where: dedupeWhere,
                attributes: ['id'],
            });
            if (existing) {
                return;
            }
        }

        await ListingView.create({
            listingId,
            viewerId,
            anonymousId,
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

        const viewsTotal = await ListingView.count({
            where: { listingId, ...dateFilter },
        });

        const uniqueAuth = await ListingView.count({
            where: {
                listingId,
                viewerId: { [Op.not]: null },
                ...dateFilter,
            },
            distinct: true,
            col: 'viewerId',
        });

        const uniqueGuest = await ListingView.count({
            where: {
                listingId,
                viewerId: null,
                anonymousId: { [Op.not]: null },
                ...dateFilter,
            },
            distinct: true,
            col: 'anonymousId',
        });

        const uniqueIp = await ListingView.count({
            where: {
                listingId,
                viewerId: null,
                anonymousId: null,
                ip: { [Op.not]: null },
                ...dateFilter,
            },
            distinct: true,
            col: 'ip',
        });

        const favoritesTotal = await Favorite.count({
            where: { propertyId: listingId },
        });

        const contacts = await Conversation.count({
            where: { propertyId: listingId, ...dateFilter },
        });

        const viewingsRequested = await Viewing.count({
            where: { propertyId: listingId, ...dateFilter },
        });

        const viewingsCompleted = await Viewing.count({
            where: { propertyId: listingId, status: 'accepted', ...dateFilter },
        });

        // Mock chart data for now, or aggregate by day
        // Real implementation would use Sequelize.fn('date_trunc', ...)

        return {
            views_total: viewsTotal,
            views_unique: uniqueAuth + uniqueGuest + uniqueIp,
            favorites_total: favoritesTotal,
            contacts,
            viewingsRequested,
            viewingsCompleted,
            sources: {
                search: 0,
                alerts: 0,
                direct: 0,
                favorites: 0,
            },
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
