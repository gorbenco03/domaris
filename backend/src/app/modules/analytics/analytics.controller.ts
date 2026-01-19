import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuthOnly, CurrentUser } from '../../core/decorators.js';

@ApiTags('analytics')
@Controller()
@AuthOnly()
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('properties/:id/analytics')
    @ApiOperation({ summary: 'Get property analytics' })
    async getPropertyAnalytics(
        @CurrentUser() user: any,
        @Param('id') id: number,
        @Query('period') period: '7d' | '30d' | 'all' = '7d'
    ) {
        // Ideally check if user is owner
        return this.analyticsService.getPropertyAnalytics(id, period);
    }

    @Get('properties/:id/analytics/suggestions')
    @ApiOperation({ summary: 'Get optimization suggestions' })
    async getSuggestions(@CurrentUser() user: any, @Param('id') id: number) {
        return {
            recommendations: [
                "Add more high-quality photos.",
                "Detailed description improves visibility.",
                "Adjust price to market average."
            ]
        };
    }

    @Get('users/me/analytics/summary')
    @ApiOperation({ summary: 'Get owner dashboard summary' })
    async getOwnerSummary(@CurrentUser() user: any) {
        return this.analyticsService.getOwnerSummary(user.id);
    }
}
