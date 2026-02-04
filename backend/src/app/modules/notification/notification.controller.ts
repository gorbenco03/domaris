import { Controller, Get, Post, Put, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { AuthOnly, CurrentUser } from '../../core/decorators.js';

@ApiTags('notifications')
@Controller()
@AuthOnly()
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get('notifications')
    @ApiOperation({ summary: 'List notifications' })
    async getNotifications(@CurrentUser() user: any) {
        return this.notificationService.getNotifications(user.id);
    }

    @Patch('notifications/:id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    async markAsRead(@CurrentUser() user: any, @Param('id') id: number) {
        await this.notificationService.markAsRead(user.id, id);
        return { success: true };
    }

    @Post('notifications/read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllAsRead(@CurrentUser() user: any) {
        await this.notificationService.markAllAsRead(user.id);
        return { success: true };
    }

    @Post('devices/push-token')
    @ApiOperation({ summary: 'Register push token' })
    async registerPushToken(
        @CurrentUser() user: any,
        @Body() body: { token: string; platform: 'ios' | 'android' | 'web'; deviceId: string }
    ) {
        await this.notificationService.registerToken(user.id, body);
        return { success: true };
    }

    @Put('users/me/notification-preferences')
    @ApiOperation({ summary: 'Update notification preferences' })
    async updatePreferences(@CurrentUser() user: any, @Body() prefs: any) {
        return this.notificationService.updatePreferences(user.id, prefs);
    }

    @Post('test/send')
    @ApiOperation({ summary: 'Send test notification (SECURE - only to logged user devices)' })
    async sendTestNotification(@CurrentUser() user: any, @Body() body: { title?: string; message?: string }) {
        return this.notificationService.sendTestNotification(user.id, body);
    }
}
