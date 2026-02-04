import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Notification } from '../../db/entities/notification.entity.js';
import { Device } from '../../db/entities/device.entity.js';
import { User } from '../../db/entities/user.entity.js';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    /**
     * Creează o notificare nouă
     */
    async create(userId: number, data: {
        type: string;
        title: string;
        body: string;
        metadata?: Record<string, any>;
    }) {
        const notification = await Notification.create({
            userId,
            type: data.type,
            title: data.title,
            body: data.body,
            metadata: data.metadata || {},
            isRead: false,
        });

        this.logger.log(`📬 Notification created for user ${userId}: ${data.title}`);

        // TODO: Trigger push notification to devices
        // const devices = await Device.findAll({ where: { userId } });
        // for (const device of devices) {
        //   await this.pushService.send(device.token, data);
        // }

        return notification;
    }

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
        this.logger.log(`📲 Register push token user=${userId} deviceId=${deviceId} platform=${platform}`);
        // Enforce global uniqueness for Expo push tokens.
        // A device push token identifies the physical installation; it must not be linked to multiple users.
        const existingByToken = await Device.findOne({ where: { token } });
        if (existingByToken) {
            existingByToken.userId = userId;
            existingByToken.deviceId = deviceId;
            existingByToken.platform = platform;
            await existingByToken.save();
            return;
        }

        // Otherwise, upsert by (userId, deviceId)
        const existingByDevice = await Device.findOne({ where: { deviceId, userId } });
        if (existingByDevice) {
            existingByDevice.token = token;
            existingByDevice.platform = platform;
            await existingByDevice.save();
            return;
        }

        await Device.create({
            userId,
            token,
            platform,
            deviceId,
        });
    }

    async updatePreferences(userId: number, prefs: any) {
        const user = await User.findByPk(userId);
        if (!user) throw new NotFoundException('User not found');
        user.notificationPreferences = { ...user.notificationPreferences, ...prefs };
        await user.save();
        return user.notificationPreferences;
    }

    async sendTestNotification(userId: number, body: { title?: string; message?: string }) {
        const { title = 'Test Notification', message = 'This is a test notification' } = body;
        
        // Get user data first (for quiet hours check)
        const user = await User.findByPk(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Check quiet hours
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        // Parse quiet hours
        const quietStart = user.notificationQuietHoursStart; // e.g., "22:00:00"
        const quietEnd = user.notificationQuietHoursEnd;     // e.g., "08:00:00"
        const quietEnabled = user.notificationPreferences?.quietHoursEnabled;

        console.log('🔍 DEBUG Quiet Hours Check:');
        console.log('  Current time:', currentTime);
        console.log('  Quiet start:', quietStart);
        console.log('  Quiet end:', quietEnd);
        console.log('  Quiet enabled:', quietEnabled);

        let isInQuietHours = false;
        
        if (quietEnabled && quietStart && quietEnd) {
            const [startHour, startMinute] = quietStart.split(':').map(Number);
            const [endHour, endMinute] = quietEnd.split(':').map(Number);
            const [currentHour, currentMinute] = currentTime.split(':').map(Number);
            
            const currentMinutes = currentHour * 60 + currentMinute;
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            
            console.log('  Current minutes:', currentMinutes);
            console.log('  Start minutes:', startMinutes);
            console.log('  End minutes:', endMinutes);
            
            if (startMinutes <= endMinutes) {
                // Same day range (e.g., 22:00 - 08:00 is invalid, should be 22:00 - 23:59)
                isInQuietHours = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
                console.log('  Same day range, in quiet hours:', isInQuietHours);
            } else {
                // Cross midnight range (e.g., 22:00 - 08:00)
                isInQuietHours = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
                console.log('  Cross midnight range, in quiet hours:', isInQuietHours);
            }
        } else {
            console.log('  Quiet hours not enabled or missing data');
        }
        
        console.log('  Final result - in quiet hours:', isInQuietHours);

        // If in quiet hours, don't send
        if (isInQuietHours) {
            return {
                success: false,
                message: `Notification blocked due to quiet hours (${quietStart} - ${quietEnd}, current time: ${currentTime})`,
                quietHours: {
                    enabled: quietEnabled,
                    start: quietStart,
                    end: quietEnd,
                    currentTime,
                },
            };
        }
        
        // Get user's registered devices
        const devices = await Device.findAll({ where: { userId } });
        
        if (devices.length === 0) {
            return { success: false, message: 'No devices registered for this user' };
        }

        const results = [];
        
        for (const device of devices) {
            try {
                // Send to this specific user's device only
                const response = await fetch('https://api.expo.dev/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: device.token,
                        title,
                        message,
                        data: {
                            type: 'test',
                            userId: userId.toString(),
                            timestamp: new Date().toISOString(),
                        },
                    }),
                });

                const result = await response.json() as any;
                results.push({
                    deviceId: device.deviceId,
                    platform: device.platform,
                    status: result.data?.status || 'error',
                    id: result.data?.id,
                });
            } catch (error: any) {
                results.push({
                    deviceId: device.deviceId,
                    platform: device.platform,
                    status: 'error',
                    error: error?.message || 'Unknown error',
                });
            }
        }

        return {
            success: true,
            message: `Sent to ${results.length} device(s)`,
            results,
            quietHours: {
                enabled: quietEnabled,
                start: quietStart,
                end: quietEnd,
                currentTime,
                blocked: false,
            },
        };
    }

    /**
     * Obține numărul de notificări necitite
     */
    async getUnreadCount(userId: number): Promise<number> {
        return Notification.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Șterge o notificare
     */
    async delete(userId: number, id: number) {
        const notification = await Notification.findOne({ where: { id, userId } });
        if (!notification) throw new NotFoundException('Notification not found');
        await notification.destroy();
    }
}

