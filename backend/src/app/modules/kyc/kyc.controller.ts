import { Controller, Post, Get, UseInterceptors, UploadedFiles, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthOnly, CurrentUser } from '../../core/decorators';

@ApiTags('kyc')
@Controller('kyc')
@AuthOnly()
export class KycController {
    constructor(private readonly kycService: KycService) { }

    @Post('verify-id')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'docFront', maxCount: 1 },
        { name: 'docBack', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Start identity verification' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                docType: { type: 'string', enum: ['id_card', 'passport', 'driving_license'] },
                docFront: { type: 'string', format: 'binary' },
                docBack: { type: 'string', format: 'binary' },
                selfie: { type: 'string', format: 'binary' },
            }
        }
    })
    async verifyId(
        @CurrentUser() user: any,
        @UploadedFiles() files: { docFront?: Express.Multer.File[], docBack?: Express.Multer.File[], selfie?: Express.Multer.File[] },
        @Body('docType') docType: string
    ) {
        return this.kycService.startIdVerification(user.id, docType, files);
    }

    @Get('status')
    @ApiOperation({ summary: 'Get KYC status' })
    async getStatus(@CurrentUser() user: any) {
        return this.kycService.getStatus(user.id);
    }

    @Post('property-doc')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'file', maxCount: 1 },
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload property ownership document' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                propertyId: { type: 'integer' },
                docType: { type: 'string' },
                file: { type: 'string', format: 'binary' },
            }
        }
    })
    async uploadPropertyDoc(
        @CurrentUser() user: any,
        @UploadedFiles() files: { file?: Express.Multer.File[] },
        @Body('propertyId') propertyId: number,
        @Body('docType') docType: string
    ) {
        return this.kycService.verifyProperty(user.id, propertyId, docType, files.file?.[0]);
    }
}
