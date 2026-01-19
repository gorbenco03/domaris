import { Public, AuthOnly, CurrentUser } from '../../core/decorators.js';
import { CompleteProfileDto } from './user.dto.js';
import { Controller, Post, Body, Req, Get, Patch, Delete, Param, BadRequestException, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @AuthOnly()
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async me(@CurrentUser() user: any) {
        return this.userService.getProfile(user.id);
    }

    @AuthOnly()
    @Put('me')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@CurrentUser() user: any, @Body() dto: CompleteProfileDto) {
        return this.userService.updateProfile(user.id, dto);
    }

    @AuthOnly()
    @Patch('me/avatar')
    @UseInterceptors(FileInterceptor('file'))
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
    async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
        // In a real app, upload to S3 here. For now, mock return.
        const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
        return this.userService.updateAvatar(user.id, mockUrl);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get public user profile' })
    async getPublicProfile(@Param('id') id: string) {
        return this.userService.getPublicProfile(id);
    }

    @Delete(':id')
    @Public() // Make it public for testing - REMOVE THIS IN PRODUCTION!
    @ApiOperation({ summary: 'Delete user (Debug only)' })
    async deleteUser(@Param('id') id: string) {
        const userId = parseInt(id);
        if (isNaN(userId)) {
            throw new BadRequestException('Invalid user ID');
        }
        return await this.userService.deleteUser(userId);
    }
}
