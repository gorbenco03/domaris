/**
 * 🔖 SAVED SEARCHES CONTROLLER
 * 
 * Endpoints:
 * - GET    /saved-searches          - List all saved searches
 * - GET    /saved-searches/:id      - Get saved search details
 * - POST   /saved-searches          - Create new saved search
 * - PUT    /saved-searches/:id      - Update saved search
 * - DELETE /saved-searches/:id      - Delete saved search
 * - GET    /saved-searches/:id/run  - Execute saved search
 * - PATCH  /saved-searches/:id/alerts - Toggle alerts
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SavedSearchService } from './saved-search.service.js';
import { CurrentUserId } from '../../core/decorators.js';

// DTOs for Swagger
class CreateSavedSearchBody {
  name!: string;
  params!: Record<string, any>;
  alertsEnabled?: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

class UpdateSavedSearchBody {
  name?: string;
  params?: Record<string, any>;
  alertsEnabled?: boolean;
  alertFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

class ToggleAlertsBody {
  enabled!: boolean;
  frequency?: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

@ApiTags('saved-searches')
@ApiBearerAuth()
@Controller('saved-searches')
export class SavedSearchController {
  constructor(private readonly savedSearchService: SavedSearchService) {}

  // ========================================================================
  // 📋 LIST
  // ========================================================================

  @Get()
  @ApiOperation({ summary: 'Get all saved searches for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of saved searches with match counts',
  })
  async getAll(@CurrentUserId() userId: number) {
    return this.savedSearchService.getAll(userId);
  }

  // ========================================================================
  // 🔍 GET BY ID
  // ========================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Get saved search details' })
  @ApiResponse({ status: 200, description: 'Saved search details' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  async getById(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) searchId: number
  ) {
    return this.savedSearchService.getById(userId, searchId);
  }

  // ========================================================================
  // ➕ CREATE
  // ========================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new saved search' })
  @ApiBody({ type: CreateSavedSearchBody })
  @ApiResponse({ status: 201, description: 'Saved search created' })
  @ApiResponse({ status: 409, description: 'Search with this name already exists' })
  async create(
    @CurrentUserId() userId: number,
    @Body() body: CreateSavedSearchBody
  ) {
    return this.savedSearchService.create(userId, body);
  }

  // ========================================================================
  // ✏️ UPDATE
  // ========================================================================

  @Put(':id')
  @ApiOperation({ summary: 'Update saved search' })
  @ApiBody({ type: UpdateSavedSearchBody })
  @ApiResponse({ status: 200, description: 'Saved search updated' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) searchId: number,
    @Body() body: UpdateSavedSearchBody
  ) {
    return this.savedSearchService.update(userId, searchId, body);
  }

  // ========================================================================
  // 🗑️ DELETE
  // ========================================================================

  @Delete(':id')
  @ApiOperation({ summary: 'Delete saved search' })
  @ApiResponse({ status: 200, description: 'Saved search deleted' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  async delete(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) searchId: number
  ) {
    return this.savedSearchService.delete(userId, searchId);
  }

  // ========================================================================
  // 🚀 EXECUTE
  // ========================================================================

  @Get(':id/run')
  @ApiOperation({ summary: 'Execute saved search and get results' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  async execute(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) searchId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.savedSearchService.execute(
      userId,
      searchId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  // ========================================================================
  // 🔔 ALERTS
  // ========================================================================

  @Patch(':id/alerts')
  @ApiOperation({ summary: 'Toggle alerts for saved search' })
  @ApiBody({ type: ToggleAlertsBody })
  @ApiResponse({ status: 200, description: 'Alert settings updated' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  async toggleAlerts(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) searchId: number,
    @Body() body: ToggleAlertsBody
  ) {
    return this.savedSearchService.toggleAlerts(
      userId,
      searchId,
      body.enabled,
      body.frequency
    );
  }
}
