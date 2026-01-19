import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthOnly, CurrentUser } from '../../core/decorators.js';
import { ViewingService } from './viewing.service.js';

@ApiTags('viewings')
@Controller('viewings')
@AuthOnly()
export class ViewingController {
    constructor(private readonly viewingService: ViewingService) { }

    @Get()
    @ApiOperation({ summary: 'Get my viewings (as seeker or owner)' })
    async getViewings(
        @CurrentUser() user: any,
        @Query('role') role?: 'seeker' | 'owner'
    ) {
        return this.viewingService.getViewings(user.id, role);
    }

    @Post()
    @ApiOperation({ summary: 'Request a viewing' })
    async requestViewing(
        @CurrentUser() user: any,
        @Body('propertyId') propertyId: number,
        @Body('slot') slot: string,
        @Body('notes') notes?: string
    ) {
        return this.viewingService.requestViewing(user.id, propertyId, slot, notes);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Accept/Reject viewing' })
    async updateStatus(
        @CurrentUser() user: any,
        @Param('id') viewingId: number,
        @Body('status') status: 'accepted' | 'rejected' | 'cancelled'
    ) {
        return this.viewingService.updateStatus(user.id, viewingId, status);
    }
}
