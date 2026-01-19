import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { AuthOnly, CurrentUser } from '../../core/decorators.js';

@ApiTags('favorites')
@Controller('favorites')
@AuthOnly()
export class FavoriteController {
    constructor(private readonly favoriteService: FavoriteService) { }

    @Get()
    @ApiOperation({ summary: 'Get my favorites' })
    async getFavorites(@CurrentUser() user: any) {
        return this.favoriteService.getFavorites(user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Add property to favorites' })
    async addFavorite(
        @CurrentUser() user: any,
        @Body('propertyId') propertyId: number,
        @Body('listId') listId?: string
    ) {
        return this.favoriteService.addFavorite(user.id, propertyId, listId);
    }

    @Delete(':propertyId')
    @ApiOperation({ summary: 'Remove property from favorites' })
    async removeFavorite(
        @CurrentUser() user: any,
        @Param('propertyId') propertyId: number
    ) {
        await this.favoriteService.removeFavorite(user.id, propertyId);
        return { success: true };
    }
}
