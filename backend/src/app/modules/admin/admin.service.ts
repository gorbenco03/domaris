import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../db/entities/user.entity.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { Op } from 'sequelize';

@Injectable()
export class AdminService {
    async getUsers(page: number, limit: number, search?: string) {
        const offset = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where[Op.or] = [
                { email: { [Op.iLike]: `%${search}%` } },
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } }
            ];
        }
        return User.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
    }

    async deleteUser(userId: number) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');
        await user.destroy(); // Soft delete if paranoid: true
    }

    /**
     * Actualizează nivelul de verificare al utilizatorului
     * Conform ADR-001: Model Unificat
     */
    async updateVerificationLevel(userId: number, level: 0 | 1 | 2 | 3) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');
        user.verificationLevel = level;
        await user.save();
        return user;
    }

    /**
     * Setează sau elimină statusul de admin
     * Conform ADR-001: Model Unificat
     */
    async setAdminStatus(userId: number, isAdmin: boolean) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');
        user.isAdmin = isAdmin;
        await user.save();
        return user;
    }

    async listings(page: number, limit: number, status?: string) {
        const offset = (page - 1) * limit;
        const where: any = {};
        if (status) where.status = status;

        return Listing.findAndCountAll({
            where,
            limit,
            offset,
            include: [{ model: User, as: 'owner', attributes: ['id', 'email', 'firstName', 'lastName'] }],
            order: [['createdAt', 'DESC']]
        });
    }

    async updateListingStatus(id: number, status: string) {
        const listing = await Listing.findByPk(id);
        if (!listing) throw new NotFoundException('Listing not found');
        // @ts-ignore
        listing.status = status;
        await listing.save();
        return listing;
    }

    async getSystemStats() {
        const totalUsers = await User.count();
        const totalListings = await Listing.count();
        const newUsers24h = await User.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
        const newListings24h = await Listing.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });

        return {
            totalUsers,
            totalListings,
            newUsers24h,
            newListings24h
        };
    }
}
