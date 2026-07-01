/**
 * 🔍 KYC CONTROLLER - Verificare Identitate
 *
 * Conform ADR-001: Model de Cont Unificat
 *
 * Endpoints:
 * - POST /kyc/verify-id - Start identity verification (nivel 2)
 * - GET /kyc/status - Get current KYC status
 * - POST /kyc/property-doc - Upload property document (nivel 3)
 *
 * Admin Endpoints:
 * - GET /kyc/admin/pending - List pending verifications
 * - POST /kyc/admin/approve/:userId - Approve verification
 * - POST /kyc/admin/reject/:userId - Reject verification
 */

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';

const KYC_ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
const KYC_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const kycFileFilter = (_req: any, file: Express.Multer.File, cb: Function) => {
  if (!KYC_ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
  }
  cb(null, true);
};
import { KycService } from './kyc.service';
import {
  CurrentUserId,
  CurrentUser,
  RequireAdmin,
} from '../../core/decorators';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard } from '../../core/admin.guard';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  @Post('verify-id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'docFront', maxCount: 1 },
        { name: 'docBack', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      { limits: { fileSize: KYC_MAX_FILE_SIZE }, fileFilter: kycFileFilter },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Start identity verification (for level 2)',
    description:
      'Upload identity documents to start KYC process. Required for posting listings.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['docType', 'docFront', 'selfie'],
      properties: {
        docType: {
          type: 'string',
          enum: ['ID_CARD', 'PASSPORT', 'DRIVING_LICENSE'],
          description: 'Type of identity document',
        },
        docFront: {
          type: 'string',
          format: 'binary',
          description: 'Front side of the document',
        },
        docBack: {
          type: 'string',
          format: 'binary',
          description: 'Back side of the document (if applicable)',
        },
        selfie: {
          type: 'string',
          format: 'binary',
          description: 'Selfie holding the document',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Verification started' })
  @ApiResponse({ status: 400, description: 'Already pending or invalid data' })
  async verifyId(
    @CurrentUserId() userId: number,
    @UploadedFiles()
    files: {
      docFront?: Express.Multer.File[];
      docBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
    @Body('docType') docType: string,
  ) {
    return this.kycService.startIdVerification(userId, docType, files);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get KYC status',
    description:
      'Returns current verification level, pending verifications, and next steps.',
  })
  @ApiResponse({ status: 200, description: 'KYC status retrieved' })
  async getStatus(@CurrentUserId() userId: number) {
    return this.kycService.getStatus(userId);
  }

  @Post('property-doc')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'file', maxCount: 1 }],
      { limits: { fileSize: KYC_MAX_FILE_SIZE }, fileFilter: kycFileFilter },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload property ownership document (for level 3)',
    description:
      'Upload documents proving property ownership for verified owner badge.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['docType', 'file'],
      properties: {
        propertyId: {
          type: 'integer',
          description: 'Optional property ID (if already created)',
        },
        docType: {
          type: 'string',
          enum: ['PROPERTY_DEED', 'UTILITY_BILL', 'OTHER'],
          description: 'Type of property document',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF or image)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Document uploaded' })
  @ApiResponse({ status: 400, description: 'Identity not verified yet' })
  async uploadPropertyDoc(
    @CurrentUserId() userId: number,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body('propertyId') propertyId?: number,
    @Body('docType') docType: string,
  ) {
    return this.kycService.verifyProperty(
      userId,
      propertyId,
      docType,
      files.file?.[0],
    );
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  @Get('admin/pending')
  @UseGuards(AdminGuard)
  @RequireAdmin()
  @ApiOperation({
    summary: '[Admin] List pending verifications',
    description: 'Returns all verifications waiting for review.',
  })
  @ApiResponse({ status: 200, description: 'Pending verifications list' })
  @ApiResponse({ status: 403, description: 'Admin privileges required' })
  async getPendingVerifications() {
    return this.kycService.getPendingVerifications();
  }

  @Post('admin/approve/:userId')
  @UseGuards(AdminGuard)
  @RequireAdmin()
  @ApiOperation({
    summary: '[Admin] Approve verification',
    description: 'Approves a pending verification and updates user level.',
  })
  @ApiResponse({ status: 200, description: 'Verification approved' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  @ApiResponse({ status: 403, description: 'Admin privileges required' })
  async approveVerification(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUserId() adminId: number,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    return this.kycService.approveVerification(
      userId,
      adminId,
      admin.email,
      req.ip,
      req.headers['user-agent']
    );
  }

  @Post('admin/reject/:userId')
  @UseGuards(AdminGuard)
  @RequireAdmin()
  @ApiOperation({
    summary: '[Admin] Reject verification',
    description: 'Rejects a pending verification with a reason.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: {
          type: 'string',
          description: 'Rejection reason',
          example: 'Document ilizibil sau expirat',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Verification rejected' })
  @ApiResponse({ status: 404, description: 'Verification not found' })
  @ApiResponse({ status: 403, description: 'Admin privileges required' })
  async rejectVerification(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('reason') reason: string,
    @CurrentUserId() adminId: number,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    return this.kycService.rejectVerification(
      userId,
      reason,
      adminId,
      admin.email,
      req.ip,
      req.headers['user-agent']
    );
  }
}
