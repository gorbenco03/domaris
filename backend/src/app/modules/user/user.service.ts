/**
 * 👤 USER SERVICE - Conform ADR-001: Model de Cont Unificat
 *
 * Gestionează operațiile cu utilizatori folosind verificationLevel
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../../db/entities/user.entity.js';
import { CompleteProfileDto, UpdateNotificationPreferencesDto } from './user.dto.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { Op } from 'sequelize';

@Injectable()
export class UserService {
  // ============================================================================
  // PROFILE METHODS
  // ============================================================================

  /**
   * Get current user's full profile
   */
  async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'googleId', 'appleId'] },
    });
    if (!user) throw new NotFoundException('Utilizator negăsit');

    // Get active listings count
    const activeListingsCount = await Listing.count({
      where: {
        ownerId: userId,
        status: { [Op.in]: ['public', 'early_access'] }, // Only valid enums
      },
    });

    return {
      ...user.toSessionData(),
      bio: user.bio,
      location: user.location,
      phone: user.phone,
      rating: user.rating,
      reviewsCount: user.reviewsCount,
      activeListingsCount,
      notificationPreferences: user.notificationPreferences,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      
      // ADR-001: Include verification info
      verification: {
        level: user.verificationLevel,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        badge: user.getVerificationBadge(),
        canPost: user.canPostListings(),
        canContact: user.canContact(),
      },
    };
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userId: number, dto: CompleteProfileDto) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('Utilizator negăsit');

    // Update basic info
    if (dto.fullName) {
      const parts = dto.fullName.trim().split(' ');
      user.firstName = parts[0];
      user.lastName = parts.slice(1).join(' ') || undefined;
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.location !== undefined) user.location = dto.location;
    if (dto.phone !== undefined) {
      // Check if phone is already taken
      if (dto.phone) {
        const existingUser = await User.findOne({
          where: { phone: dto.phone, id: { [Op.ne]: userId } },
        });
        if (existingUser) {
          throw new BadRequestException('Acest număr de telefon este deja asociat altui cont');
        }
      }
      user.phone = dto.phone;
      // Reset phone verification if changed
      if (dto.phone !== user.phone) {
        user.phoneVerified = false;
      }
    }

    await user.save();
    return this.getProfile(userId);
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(userId: number, dto: UpdateNotificationPreferencesDto) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('Utilizator negăsit');

    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...dto,
    };

    await user.save();
    return { 
      success: true, 
      notificationPreferences: user.notificationPreferences,
    };
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: number, avatarUrl: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('Utilizator negăsit');

    user.avatar = avatarUrl;
    await user.save();
    return { success: true, avatar: avatarUrl };
  }

  // ============================================================================
  // PUBLIC PROFILE
  // ============================================================================

  /**
   * Get public profile (what other users see)
   * ADR-001: Uses toPublicProfile() for privacy
   */
  async getPublicProfile(id: string | number) {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundException('Utilizator negăsit');

    // Get active listings count
    const activeListingsCount = await Listing.count({
      where: {
        ownerId: Number(id),
        status: { [Op.in]: ['public', 'early_access'] },
      },
    });

    const publicProfile = user.toPublicProfile();
    
    return {
      ...publicProfile,
      activeListingsCount,
    };
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  /**
   * Delete user account
   */
  async deleteUser(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('Utilizator negăsit');
    
    // Soft delete (paranoid is enabled on model)
    await user.destroy();
    
    return { success: true, message: 'Cont șters' };
  }

  /**
   * Request account data export (GDPR)
   */
  async requestDataExport(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundException('Utilizator negăsit');

    // In production, this would trigger an async job
    // For now, return user data directly
    return {
      success: true,
      message: 'Export în curs de procesare. Vei primi un email când va fi gata.',
      // For demo, include data directly
      data: {
        profile: user.toJSON(),
        // TODO: Include listings, messages, favorites, etc.
      },
    };
  }

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get all users (admin only)
   */
  async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    verificationLevel?: number;
  }) {
    const { page = 1, limit = 20, search, verificationLevel } = params;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (verificationLevel !== undefined) {
      where.verificationLevel = verificationLevel;
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'googleId', 'appleId'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + users.length < total,
      },
    };
  }

  /**
   * Update user verification level (admin only)
   */
  async updateVerificationLevel(
    userId: number,
    level: number,
    adminId: number,
  ) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('Utilizator negăsit');

    if (level < 0 || level > 3) {
      throw new BadRequestException('Nivel de verificare invalid (0-3)');
    }

    const previousLevel = user.verificationLevel;
    user.verificationLevel = level;
    await user.save();

    console.log(
      `[ADMIN] User ${userId} verification level changed from ${previousLevel} to ${level} by admin ${adminId}`,
    );

    return {
      success: true,
      message: `Nivel actualizat de la ${previousLevel} la ${level}`,
      user: user.toSessionData(),
    };
  }

  /**
   * Toggle admin status (super-admin only)
   */
  async toggleAdminStatus(userId: number, isAdmin: boolean) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('Utilizator negăsit');

    user.isAdmin = isAdmin;
    await user.save();

    return {
      success: true,
      message: isAdmin ? 'Utilizator promovat la admin' : 'Privilegii admin revocate',
      user: user.toSessionData(),
    };
  }
}
