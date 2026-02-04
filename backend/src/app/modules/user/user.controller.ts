/**
 * 👤 USER CONTROLLER - Conform ADR-001: Model de Cont Unificat
 *
 * Endpoints:
 * - GET /users/me - Get current user profile (authenticated)
 * - PUT /users/me - Update profile (authenticated)
 * - PATCH /users/me/avatar - Upload avatar (authenticated)
 * - PATCH /users/me/notifications - Update notification preferences
 * - GET /users/:id - Get public profile (public)
 * - POST /users/me/export - Request data export (GDPR)
 * - DELETE /users/me - Delete account
 *
 * Admin Endpoints:
 * - GET /users/admin/all - List all users
 * - PATCH /users/admin/:id/verification - Update verification level
 * - PATCH /users/admin/:id/admin - Toggle admin status
 */

import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service.js';
import {
  CompleteProfileDto,
  UpdateNotificationPreferencesDto,
  UpdateQuietHoursDto,
} from './user.dto.js';
import {
  WithdrawConsentDto,
  GrantConsentDto,
  UpdateConsentsDto,
} from './consent.dto.js';
import {
  Public,
  CurrentUserId,
  RequireAdmin,
} from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard } from '../../core/admin.guard';
import { ConsentService } from '../../core/consent/consent.service.js';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly consentService: ConsentService,
  ) {}

  // ============================================================================
  // CURRENT USER ENDPOINTS
  // ============================================================================

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async me(@CurrentUserId() userId: number) {
    return this.userService.getProfile(userId);
  }

  @UseGuards(AuthGuard)
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUserId() userId: number,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated' })
  async uploadAvatar(
    @CurrentUserId() userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // TODO: Upload to S3 in production
    const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&timestamp=${Date.now()}`;
    return this.userService.updateAvatar(userId, mockUrl);
  }

  @UseGuards(AuthGuard)
  @Patch('me/notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updateNotifications(
    @CurrentUserId() userId: number,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.userService.updateNotificationPreferences(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('me/quiet-hours')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification quiet hours' })
  @ApiResponse({ status: 200, description: 'Quiet hours updated' })
  async updateQuietHours(
    @CurrentUserId() userId: number,
    @Body() dto: UpdateQuietHoursDto,
  ) {
    return this.userService.updateQuietHours(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Post('me/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request data export (GDPR)' })
  @ApiResponse({ status: 200, description: 'Export initiated' })
  async requestExport(@CurrentUserId() userId: number) {
    return this.userService.requestDataExport(userId);
  }

  @UseGuards(AuthGuard)
  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete my account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async deleteMyAccount(@CurrentUserId() userId: number) {
    return this.userService.deleteUser(userId);
  }

  // ============================================================================
  // GDPR CONSENT MANAGEMENT
  // ============================================================================

  @UseGuards(AuthGuard)
  @Get('me/consents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my current consent status (GDPR)' })
  @ApiResponse({ status: 200, description: 'Consent status for all types' })
  async getMyConsents(@CurrentUserId() userId: number) {
    const consents = await this.consentService.getUserConsents(userId);

    // Transform to user-friendly format
    const result: Record<string, any> = {};
    for (const [type, consent] of Object.entries(consents)) {
      result[type] = consent ? {
        granted: consent.granted,
        version: consent.version,
        grantedAt: consent.grantedAt,
        withdrawnAt: consent.withdrawnAt,
        status: consent.getStatus(),
      } : null;
    }

    return result;
  }

  @UseGuards(AuthGuard)
  @Get('me/consents/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my consent history (GDPR audit)' })
  @ApiResponse({ status: 200, description: 'Full consent history' })
  async getConsentHistory(@CurrentUserId() userId: number) {
    return this.consentService.getConsentHistory(userId);
  }

  @UseGuards(AuthGuard)
  @Post('me/consents/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw consent (GDPR right) - MARKETING or ANALYTICS only' })
  @ApiResponse({ status: 200, description: 'Consent withdrawn' })
  @ApiResponse({ status: 400, description: 'Cannot withdraw mandatory consent' })
  async withdrawConsent(
    @CurrentUserId() userId: number,
    @Body() dto: WithdrawConsentDto,
    @Req() req: any,
  ) {
    const consent = await this.consentService.withdrawConsent(
      userId,
      dto.consentType,
      req.ip,
      req.headers['user-agent']
    );

    return {
      success: true,
      message: `Consent for ${dto.consentType} has been withdrawn`,
      consent,
    };
  }

  @UseGuards(AuthGuard)
  @Post('me/consents/grant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grant consent (GDPR) - For re-enabling MARKETING or ANALYTICS' })
  @ApiResponse({ status: 200, description: 'Consent granted' })
  async grantConsent(
    @CurrentUserId() userId: number,
    @Body() dto: GrantConsentDto,
    @Req() req: any,
  ) {
    const consent = await this.consentService.grantConsent(
      userId,
      dto.consentType,
      req.ip,
      req.headers['user-agent']
    );

    return {
      success: true,
      message: `Consent for ${dto.consentType} has been granted`,
      consent,
    };
  }

  @UseGuards(AuthGuard)
  @Patch('me/consents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update optional consents (MARKETING, ANALYTICS)' })
  @ApiResponse({ status: 200, description: 'Consents updated' })
  async updateConsents(
    @CurrentUserId() userId: number,
    @Body() dto: UpdateConsentsDto,
    @Req() req: any,
  ) {
    const results: any = {};

    // Update marketing consent
    if (dto.acceptMarketing !== undefined) {
      if (dto.acceptMarketing) {
        results.marketing = await this.consentService.grantConsent(
          userId,
          'MARKETING' as any,
          req.ip,
          req.headers['user-agent']
        );
      } else {
        results.marketing = await this.consentService.withdrawConsent(
          userId,
          'MARKETING' as any,
          req.ip,
          req.headers['user-agent']
        );
      }
    }

    // Update analytics consent
    if (dto.acceptAnalytics !== undefined) {
      if (dto.acceptAnalytics) {
        results.analytics = await this.consentService.grantConsent(
          userId,
          'ANALYTICS' as any,
          req.ip,
          req.headers['user-agent']
        );
      } else {
        results.analytics = await this.consentService.withdrawConsent(
          userId,
          'ANALYTICS' as any,
          req.ip,
          req.headers['user-agent']
        );
      }
    }

    return {
      success: true,
      message: 'Consents updated successfully',
      results,
    };
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  @UseGuards(AuthGuard, AdminGuard)
  @RequireAdmin()
  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List all users' })
  @ApiResponse({ status: 200, description: 'Paginated users list' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('verificationLevel') verificationLevel?: string,
  ) {
    return this.userService.getAllUsers({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      verificationLevel: verificationLevel ? parseInt(verificationLevel) : undefined,
    });
  }

  @UseGuards(AuthGuard, AdminGuard)
  @RequireAdmin()
  @Patch('admin/:id/verification')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update user verification level' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['level'],
      properties: {
        level: {
          type: 'integer',
          minimum: 0,
          maximum: 3,
          description: '0=new, 1=email/phone verified, 2=identity verified, 3=property verified',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Level updated' })
  async updateVerificationLevel(
    @Param('id', ParseIntPipe) userId: number,
    @Body('level') level: number,
    @CurrentUserId() adminId: number,
  ) {
    return this.userService.updateVerificationLevel(userId, level, adminId);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @RequireAdmin()
  @Patch('admin/:id/admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Toggle admin status' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['isAdmin'],
      properties: {
        isAdmin: {
          type: 'boolean',
          description: 'Grant or revoke admin privileges',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Admin status updated' })
  async toggleAdmin(
    @Param('id', ParseIntPipe) userId: number,
    @Body('isAdmin') isAdmin: boolean,
  ) {
    return this.userService.toggleAdminStatus(userId, isAdmin);
  }

  // ============================================================================
  // PUBLIC PROFILE
  // ============================================================================

  // IMPORTANT: More specific routes must come before generic :id route
  @Public()
  @Get(':id/listings')
  @ApiOperation({ summary: 'Get public listings for a user' })
  @ApiResponse({ status: 200, description: 'User listings' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserListings(@Param('id') id: string) {
    return this.userService.getUserListings(id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiResponse({ status: 200, description: 'Public profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }
}
