import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthOnly } from '../../core/decorators.js';
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
    async deleteUser(@Param('id') id: number) {
        await this.adminService.deleteUser(id);
        return { success: true };
    }

    @Patch('users/:id/role')
    @ApiOperation({ summary: 'Update user role (Admin)' })
    async updateUserRole(@Param('id') id: number, @Body('role') role: 'tenant' | 'landlord' | 'admin') {
        return this.adminService.updateUserRole(id, role);
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
    async updateListingStatus(@Param('id') id: number, @Body('status') status: string) {
        return this.adminService.updateListingStatus(id, status);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get system stats (Admin)' })
    async getStats() {
        return this.adminService.getSystemStats();
    }
}
