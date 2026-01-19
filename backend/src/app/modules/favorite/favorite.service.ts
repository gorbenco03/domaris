import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Favorite } from '../../db/entities/favorite.entity.js';
import { Listing } from '../../db/entities/listing.entity.js';

@Injectable()
export class FavoriteService {
    async getFavorites(userId: number) {
        return Favorite.findAll({
            where: { userId },
            include: [
                { model: Listing, attributes: ['id', 'title', 'priceEur', 'addressText', 'lat', 'lng', 'isFurnished'] } // Select specific fields for list view
            ],
            order: [['createdAt', 'DESC']],
        });
    }

    async addFavorite(userId: number, propertyId: number, listId?: string) {
        const existing = await Favorite.findOne({ where: { userId, propertyId } });
        if (existing) {
            throw new ConflictException('Property already in favorites');
        }

        // Check if property exists
        const listing = await Listing.findByPk(propertyId);
        if (!listing) throw new NotFoundException('Property not found');

        return Favorite.create({
            userId,
            propertyId,
            listId,
        });
    }

    async removeFavorite(userId: number, propertyId: number) {
        const favorite = await Favorite.findOne({ where: { userId, propertyId } });
        if (!favorite) {
            throw new NotFoundException('Favorite not found');
        }
        await favorite.destroy();
    }
}
