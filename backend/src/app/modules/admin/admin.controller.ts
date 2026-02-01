import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthOnly, CurrentUser } from '../../core/decorators.js';
import { AdminGuard } from '../../core/admin.guard.js';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@AuthOnly()
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    @ApiOperation({ summary: 'List all users (Admin)' })
    async getUsers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('search') search?: string
    ) {
        return this.adminService.getUsers(page, limit, search);
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Ban/Delete user (Admin)' })
    async deleteUser(
        @Param('id') id: number,
        @CurrentUser() admin: any,
        @Req() req: any,
        @Body('reason') reason?: string
    ) {
        await this.adminService.deleteUser(
            id,
            admin.id,
            admin.email,
            req.ip,
            req.headers['user-agent'],
            reason
        );
        return { success: true };
    }

    @Patch('users/:id/verification-level')
    @ApiOperation({ summary: 'Update user verification level (Admin)' })
    async updateVerificationLevel(
        @Param('id') id: number,
        @Body('level') level: 0 | 1 | 2 | 3,
        @Body('reason') reason: string | undefined,
        @CurrentUser() admin: any,
        @Req() req: any
    ) {
        return this.adminService.updateVerificationLevel(
            id,
            level,
            admin.id,
            admin.email,
            req.ip,
            req.headers['user-agent'],
            reason
        );
    }

    @Patch('users/:id/admin-status')
    @ApiOperation({ summary: 'Set user admin status (Admin)' })
    async setAdminStatus(
        @Param('id') id: number,
        @Body('isAdmin') isAdmin: boolean,
        @CurrentUser() admin: any,
        @Req() req: any
    ) {
        return this.adminService.setAdminStatus(
            id,
            isAdmin,
            admin.id,
            admin.email,
            req.ip,
            req.headers['user-agent']
        );
    }

    @Get('listings')
    @ApiOperation({ summary: 'List all listings (Admin)' })
    async getListings(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string
    ) {
        return this.adminService.listings(page, limit, status);
    }

    @Patch('listings/:id/status')
    @ApiOperation({ summary: 'Update listing status (Admin)' })
    async updateListingStatus(
        @Param('id') id: number,
        @Body('status') status: string,
        @Body('reason') reason: string | undefined,
        @CurrentUser() admin: any,
        @Req() req: any
    ) {
        return this.adminService.updateListingStatus(
            id,
            status,
            admin.id,
            admin.email,
            req.ip,
            req.headers['user-agent'],
            reason
        );
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get system stats (Admin)' })
    async getStats() {
        return this.adminService.getSystemStats();
    }
}
