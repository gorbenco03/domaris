/**
 * ❤️ FAVORITE CONTROLLER - Favorites & Lists
 *
 * Conform ADR-001: Model de Cont Unificat
 * - Favorites sunt accesibile pentru oricine autentificat (Level 0+)
 * - Fără restricții de verification level pentru saved items
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { CurrentUserId } from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  // ============================================================================
  // FAVORITES
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get all my favorites' })
  @ApiResponse({ status: 200, description: 'List of favorites' })
  async getFavorites(
    @CurrentUserId() userId: number,
    @Query('listId') listId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoriteService.getFavorites(userId, {
      listId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add property to favorites' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['propertyId'],
      properties: {
        propertyId: { type: 'integer' },
        listId: { type: 'string', description: 'Optional list ID to add to' },
        notes: { type: 'string', description: 'Personal notes' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Added to favorites' })
  async addFavorite(
    @CurrentUserId() userId: number,
    @Body('propertyId') propertyId: number,
    @Body('listId') listId?: string,
    @Body('notes') notes?: string,
  ) {
    return this.favoriteService.addFavorite(userId, propertyId, listId, notes);
  }

  @Delete(':propertyId')
  @ApiOperation({ summary: 'Remove property from favorites' })
  @ApiResponse({ status: 200, description: 'Removed from favorites' })
  async removeFavorite(
    @CurrentUserId() userId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    await this.favoriteService.removeFavorite(userId, propertyId);
    return { success: true, message: 'Eliminat din favorite' };
  }

  @Get('check/:propertyId')
  @ApiOperation({ summary: 'Check if property is favorited' })
  @ApiResponse({ status: 200, description: 'Favorite status' })
  async checkFavorite(
    @CurrentUserId() userId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    return this.favoriteService.checkFavorite(userId, propertyId);
  }

  // ============================================================================
  // FAVORITE LISTS
  // ============================================================================

  @Get('lists')
  @ApiOperation({ summary: 'Get my favorite lists' })
  @ApiResponse({ status: 200, description: 'List of favorite lists' })
  async getLists(@CurrentUserId() userId: number) {
    return this.favoriteService.getLists(userId);
  }

  @Post('lists')
  @ApiOperation({ summary: 'Create a new favorite list' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', maxLength: 100 },
        description: { type: 'string', maxLength: 500 },
        color: { type: 'string', description: 'Hex color code' },
        icon: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'List created' })
  async createList(
    @CurrentUserId() userId: number,
    @Body('name') name: string,
    @Body('description') description?: string,
    @Body('color') color?: string,
    @Body('icon') icon?: string,
  ) {
    return this.favoriteService.createList(userId, name, description, color, icon);
  }

  @Put('lists/:listId')
  @ApiOperation({ summary: 'Update a favorite list' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        color: { type: 'string' },
        icon: { type: 'string' },
      },
    },
  })
  async updateList(
    @CurrentUserId() userId: number,
    @Param('listId') listId: string,
    @Body() updates: { name?: string; description?: string; color?: string; icon?: string },
  ) {
    return this.favoriteService.updateList(userId, listId, updates);
  }

  @Delete('lists/:listId')
  @ApiOperation({ summary: 'Delete a favorite list' })
  @ApiResponse({ status: 200, description: 'List deleted' })
  async deleteList(
    @CurrentUserId() userId: number,
    @Param('listId') listId: string,
  ) {
    await this.favoriteService.deleteList(userId, listId);
    return { success: true, message: 'Listă ștearsă' };
  }

  // ============================================================================
  // MOVE/ORGANIZE
  // ============================================================================

  @Post('move')
  @ApiOperation({ summary: 'Move favorite to another list' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['propertyId', 'toListId'],
      properties: {
        propertyId: { type: 'integer' },
        fromListId: { type: 'string' },
        toListId: { type: 'string' },
      },
    },
  })
  async moveFavorite(
    @CurrentUserId() userId: number,
    @Body('propertyId') propertyId: number,
    @Body('toListId') toListId: string,
    @Body('fromListId') fromListId?: string,
  ) {
    return this.favoriteService.moveFavorite(userId, propertyId, toListId, fromListId);
  }

  // ============================================================================
  // COMPARE
  // ============================================================================

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple properties' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['propertyIds'],
      properties: {
        propertyIds: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 2,
          maxItems: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Comparison matrix' })
  async compareProperties(
    @CurrentUserId() userId: number,
    @Body('propertyIds') propertyIds: number[],
  ) {
    return this.favoriteService.compareProperties(userId, propertyIds);
  }
}
