import { Injectable } from '@nestjs/common';
import { Listing } from '../../db/entities/listing.entity.js';
import { Op } from 'sequelize';

@Injectable()
export class SearchService {
    async search(filters: any) {
        // Reusing standard listing find or specific search optimization
        // For now returning basic find all limited
        return Listing.findAll({ limit: 20 });
    }

    async suggestions(query: string) {
        if (!query) return [];

        // Mock suggestions based on query
        // In real app, query ElasticSearch or DB ILIKE on city/neighborhood

        return [
            { text: `${query} City`, type: 'city' },
            { text: `${query} Neighborhood`, type: 'neighborhood' }
        ];
    }

    async getMapData(filters: any) {
        // Return lightweight data for map pins/clusters
        const listings = await Listing.findAll({
            attributes: ['id', 'lat', 'lng', 'priceEur'],
            limit: 100 // limit for demo
        });

        return {
            type: 'FeatureCollection',
            features: listings.map(l => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [l.lng, l.lat]
                },
                properties: {
                    id: l.id,
                    price: l.priceEur
                }
            }))
        };
    }
}
