import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { S3Service } from '../../s3/s3.service.js';
import { AuthOnly, CurrentUser } from '../../core/decorators.js';
import { AdminGuard } from '../../core/admin.guard.js';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@AuthOnly()
@UseGuards(AdminGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly s3Service: S3Service,
    ) { }

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

    // ============================================================================
    // OWNERSHIP VERIFICATION REVIEW
    // ============================================================================

    @Get('ownership-reviews')
    @ApiOperation({ summary: 'List listings pending ownership review (Admin)' })
    async getPendingOwnershipReviews(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.adminService.getPendingOwnershipReviews(page, limit);
    }

    @Post('listings/:id/ownership-approve')
    @ApiOperation({ summary: 'Approve listing ownership (Admin)' })
    async approveOwnership(
        @Param('id') id: number,
        @CurrentUser() admin: any,
        @Req() req: any,
    ) {
        return this.adminService.approveListingOwnership(
            id,
            admin.id,
            admin.email,
            req.ip,
            req.headers['user-agent'],
        );
    }

    @Post('listings/:id/ownership-reject')
    @ApiOperation({ summary: 'Reject listing ownership (Admin)' })
    async rejectOwnership(
        @Param('id') id: number,
        @Body('reason') reason: string,
        @CurrentUser() admin: any,
        @Req() req: any,
    ) {
        return this.adminService.rejectListingOwnership(
            id,
            reason,
            admin.id,
            admin.email,
            req.ip,
            req.headers['user-agent'],
        );
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get system stats (Admin)' })
    async getStats() {
        return this.adminService.getSystemStats();
    }

    @Post('fix-images-acl')
    @ApiOperation({ summary: 'Fix ACL on all listing images to public-read (one-time)' })
    async fixImagesAcl() {
        const listingsCount = await this.s3Service.makeAllPublic('listings/');
        const ownershipCount = await this.s3Service.makeAllPublic('ownership-docs/');
        return {
            success: true,
            message: `Made ${listingsCount} listing images and ${ownershipCount} ownership docs public`,
            listingsUpdated: listingsCount,
            ownershipDocsUpdated: ownershipCount,
        };
    }
}
