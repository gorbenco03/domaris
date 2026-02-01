import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../../db/entities/user.entity.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { Op } from 'sequelize';

@Injectable()
export class AdminService {
    constructor(private readonly auditService: AuditService) {}
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

    async deleteUser(
        userId: number,
        adminId: number,
        adminEmail: string,
        ipAddress?: string,
        userAgent?: string,
        reason?: string
    ) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');

        // VALIDATION: Reason is REQUIRED for user deletion (GDPR compliance)
        if (!reason || reason.trim().length === 0) {
            throw new BadRequestException({
                code: 'REASON_REQUIRED',
                message: 'Reason is required for user deletion'
            });
        }

        // Log BEFORE deletion (to capture user data)
        await this.auditService.logUserDeletion(
            adminId,
            adminEmail,
            user,
            ipAddress,
            userAgent,
            reason
        );

        await user.destroy(); // Soft delete if paranoid: true
    }

    /**
     * Actualizează nivelul de verificare al utilizatorului
     * Conform ADR-001: Model Unificat
     */
    async updateVerificationLevel(
        userId: number,
        level: 0 | 1 | 2 | 3,
        adminId: number,
        adminEmail: string,
        ipAddress?: string,
        userAgent?: string,
        reason?: string
    ) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');

        const previousLevel = user.verificationLevel;

        // Update level
        user.verificationLevel = level;
        await user.save();

        // Log the change
        await this.auditService.logVerificationChange(
            adminId,
            adminEmail,
            userId,
            previousLevel,
            level,
            ipAddress,
            userAgent,
            reason
        );

        return user;
    }

    /**
     * Setează sau elimină statusul de admin
     * Conform ADR-001: Model Unificat
     */
    async setAdminStatus(
        userId: number,
        isAdmin: boolean,
        adminId: number,
        adminEmail: string,
        ipAddress?: string,
        userAgent?: string
    ) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');

        // Log grant or revoke
        if (isAdmin) {
            await this.auditService.logAdminGrant(
                adminId,
                adminEmail,
                userId,
                user.email,
                ipAddress,
                userAgent
            );
        } else {
            await this.auditService.logAdminRevoke(
                adminId,
                adminEmail,
                userId,
                user.email,
                ipAddress,
                userAgent
            );
        }

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

    async updateListingStatus(
        id: number,
        status: string,
        adminId: number,
        adminEmail: string,
        ipAddress?: string,
        userAgent?: string,
        reason?: string
    ) {
        const listing = await Listing.findByPk(id);
        if (!listing) throw new NotFoundException('Listing not found');

        const oldStatus = listing.status;

        // @ts-ignore
        listing.status = status;
        await listing.save();

        // Log the change
        await this.auditService.logListingStatusChange(
            adminId,
            adminEmail,
            id,
            oldStatus,
            status,
            ipAddress,
            userAgent,
            reason
        );

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
