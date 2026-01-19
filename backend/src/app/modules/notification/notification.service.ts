import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '../../db/entities/notification.entity.js';
import { Device } from '../../db/entities/device.entity.js';
import { User } from '../../db/entities/user.entity.js';

@Injectable()
export class NotificationService {
    async getNotifications(userId: number) {
        return Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50,
        });
    }

    async markAsRead(userId: number, id: number) {
        const notification = await Notification.findOne({ where: { id, userId } });
        if (!notification) throw new NotFoundException('Notification not found');
        notification.isRead = true;
        await notification.save();
    }

    async markAllAsRead(userId: number) {
        await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
    }

    async registerToken(userId: number, data: { token: string; platform: 'ios' | 'android' | 'web'; deviceId: string }) {
        const { token, platform, deviceId } = data;
        // Check if device exists
        let device = await Device.findOne({ where: { deviceId, userId } });
        if (device) {
            device.token = token;
            device.platform = platform;
            await device.save();
        } else {
            await Device.create({
                userId,
                token,
                platform,
                deviceId,
            });
        }
    }

    async updatePreferences(userId: number, prefs: any) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');
        user.notificationPreferences = { ...user.notificationPreferences, ...prefs };
        await user.save();
        return user.notificationPreferences;
    }
}
