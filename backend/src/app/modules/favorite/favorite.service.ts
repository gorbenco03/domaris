/**
 * ❤️ FAVORITE SERVICE - Favorites, Lists & Comparison
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Favorite } from '../../db/entities/favorite.entity.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { ListingImage } from '../../db/entities/listingImage.entity.js';
import { Op } from 'sequelize';

interface GetFavoritesParams {
  listId?: string;
  page?: number;
  limit?: number;
}

// In-memory storage for lists (replace with DB in production)
const favoriteLists: Map<number, any[]> = new Map();
let listIdCounter = 1;

@Injectable()
export class FavoriteService {
  // ============================================================================
  // FAVORITES
  // ============================================================================

  async getFavorites(userId: number, params: GetFavoritesParams = {}) {
    const { listId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (listId) {
      where.listId = listId;
    }

    const { rows, count } = await Favorite.findAndCountAll({
      where,
      include: [
        {
          model: Listing,
          attributes: [
            'id',
            'title',
            'priceEur',
            'addressText',
            'city',
            'surfaceSqm',
            'lat',
            'lng',
            'isFurnished',
            'rooms',
            'status',
          ],
          include: [
            {
              model: ListingImage,
              attributes: ['url', 'isPrimary', 'order'],
              required: false,
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows.map((f) => this.formatFavorite(f)),
      meta: {
        page,
        limit,
        total: count,
        hasMore: offset + rows.length < count,
      },
    };
  }

  async addFavorite(
    userId: number,
    propertyId: number,
    listId?: string,
    notes?: string,
  ) {
    const existing = await Favorite.findOne({ where: { userId, propertyId } });
    if (existing) {
      // If listId provided, update it
      if (listId) {
        existing.listId = listId;
        await existing.save();
      }
      return this.formatFavorite(existing);
    }

    const listing = await Listing.findByPk(propertyId);
    if (!listing) {
      throw new NotFoundException('Proprietate negăsită');
    }

    const favorite = await Favorite.create({
      userId,
      propertyId,
      listId,
      notes,
    });

    return this.formatFavorite(favorite);
  }

  async removeFavorite(userId: number, propertyId: number) {
    const favorite = await Favorite.findOne({ where: { userId, propertyId } });
    if (!favorite) {
      throw new NotFoundException('Favorit negăsit');
    }
    await favorite.destroy();
  }

  async checkFavorite(userId: number, propertyId: number) {
    const favorite = await Favorite.findOne({ where: { userId, propertyId } });
    return {
      isFavorite: !!favorite,
      listId: favorite?.listId || null,
      addedAt: favorite?.createdAt || null,
    };
  }

  // ============================================================================
  // FAVORITE LISTS
  // ============================================================================

  async getLists(userId: number) {
    // Get user's lists
    const userLists = favoriteLists.get(userId) || [];

    // Add default list
    const lists = [
      {
        id: 'default',
        name: 'Toate favoritele',
        isDefault: true,
        color: '#6366f1',
        icon: 'heart',
        count: await Favorite.count({ where: { userId } }),
      },
      ...userLists.map(async (list) => ({
        ...list,
        count: await Favorite.count({ where: { userId, listId: list.id } }),
      })),
    ];

    // Resolve all counts
    return Promise.all(
      lists.map(async (list) => {
        if (list instanceof Promise) return list;
        return list;
      }),
    );
  }

  async createList(
    userId: number,
    name: string,
    description?: string,
    color?: string,
    icon?: string,
  ) {
    const userLists = favoriteLists.get(userId) || [];

    // Check for duplicate name
    if (userLists.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      throw new ConflictException('O listă cu acest nume există deja');
    }

    const newList = {
      id: `list_${listIdCounter++}`,
      userId,
      name,
      description,
      color: color || '#6366f1',
      icon: icon || 'folder',
      createdAt: new Date(),
    };

    userLists.push(newList);
    favoriteLists.set(userId, userLists);

    return newList;
  }

  async updateList(
    userId: number,
    listId: string,
    updates: { name?: string; description?: string; color?: string; icon?: string },
  ) {
    const userLists = favoriteLists.get(userId) || [];
    const listIndex = userLists.findIndex((l) => l.id === listId);

    if (listIndex === -1) {
      throw new NotFoundException('Listă negăsită');
    }

    userLists[listIndex] = { ...userLists[listIndex], ...updates };
    favoriteLists.set(userId, userLists);

    return userLists[listIndex];
  }

  async deleteList(userId: number, listId: string) {
    const userLists = favoriteLists.get(userId) || [];
    const listIndex = userLists.findIndex((l) => l.id === listId);

    if (listIndex === -1) {
      throw new NotFoundException('Listă negăsită');
    }

    // Move favorites from this list to default
    await Favorite.update(
      { listId: null },
      { where: { userId, listId } },
    );

    userLists.splice(listIndex, 1);
    favoriteLists.set(userId, userLists);
  }

  // ============================================================================
  // MOVE/ORGANIZE
  // ============================================================================

  async moveFavorite(
    userId: number,
    propertyId: number,
    toListId: string,
    fromListId?: string,
  ) {
    const favorite = await Favorite.findOne({ where: { userId, propertyId } });
    if (!favorite) {
      throw new NotFoundException('Favorit negăsit');
    }

    favorite.listId = toListId === 'default' ? null : toListId;
    await favorite.save();

    return this.formatFavorite(favorite);
  }

  // ============================================================================
  // COMPARE
  // ============================================================================

  async compareProperties(userId: number, propertyIds: number[]) {
    if (propertyIds.length < 2 || propertyIds.length > 5) {
      throw new BadRequestException('Poți compara între 2 și 5 proprietăți');
    }

    const properties = await Listing.findAll({
      where: { id: { [Op.in]: propertyIds } },
      attributes: [
        'id',
        'title',
        'priceEur',
        'addressText',
        'city',
        'rooms',
        'surfaceSqm',
        'floor',
        'totalFloors',
        'isFurnished',
        'hasCentralHeating',
      ],
      include: [
        {
          model: ListingImage,
          attributes: ['url', 'isPrimary', 'order'],
          required: false,
        },
      ],
    });

    if (properties.length !== propertyIds.length) {
      throw new BadRequestException('Una sau mai multe proprietăți nu au fost găsite');
    }

    // Build comparison matrix
    const characteristics = [
      { key: 'priceEur', label: 'Preț (€)', format: 'currency' },
      { key: 'rooms', label: 'Camere', format: 'number' },
      { key: 'surfaceSqm', label: 'Suprafață (mp)', format: 'number' },
      { key: 'floor', label: 'Etaj', format: 'floor' },
      { key: 'isFurnished', label: 'Mobilat', format: 'boolean' },
      { key: 'hasCentralHeating', label: 'Încălzire centrală', format: 'boolean' },
    ];

    const matrix = characteristics.map((char) => ({
      label: char.label,
      values: properties.map((p: any) => ({
        propertyId: p.id,
        value: p[char.key],
        formatted: this.formatValue(p[char.key], char.format),
      })),
    }));

    return {
      properties: properties.map((p: any) => ({
        id: p.id,
        title: p.title,
        image: p.images?.[0]?.url,
        address: p.addressText,
        city: p.city,
      })),
      matrix,
    };
  }

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  private formatFavorite(favorite: any) {
    return {
      id: favorite.id,
      propertyId: favorite.propertyId,
      listId: favorite.listId,
      notes: favorite.notes,
      addedAt: favorite.createdAt,
      property: favorite.property
        ? {
            id: favorite.property.id,
            title: favorite.property.title,
            price: favorite.property.priceEur,
            address: favorite.property.addressText,
            city: favorite.property.city,
            area: favorite.property.surfaceSqm,
            rooms: favorite.property.rooms,
            surface: favorite.property.surfaceSqm,
            image: favorite.property.images?.[0]?.url,
            isFurnished: favorite.property.isFurnished,
            status: favorite.property.status,
            coordinates: favorite.property.lat
              ? { lat: favorite.property.lat, lng: favorite.property.lng }
              : null,
          }
        : null,
    };
  }

  private formatValue(value: any, format: string): string {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return `€${Number(value).toLocaleString()}`;
      case 'number':
        return String(value);
      case 'floor':
        return value === 0 ? 'Parter' : `Etaj ${value}`;
      case 'boolean':
        return value ? 'Da' : 'Nu';
      default:
        return String(value);
    }
  }
}
