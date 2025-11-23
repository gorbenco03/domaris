import { Public, AuthOnly } from '../../core/decorators.js';
import { CompleteProfileDto, SocialLoginDto } from './user.dto.js';
import { Controller, Post, Body, Req, Get, Patch, Delete, Param, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Public()
    @Post('google')
    async loginGoogle(@Body() body: SocialLoginDto) {
      try {
        const result = await this.userService.loginWithGoogle(body.idToken);

        return result;
      } catch (error) {
        throw error;
      }
    }

    @Public()
    @Post('apple')
    loginApple(@Body() body: SocialLoginDto) {
      console.log(body);
        return this.userService.loginWithApple(body.idToken);
    }

    @AuthOnly()
    @Get('me')
    async me(@Req() req: any) {
        try {
            const result = await this.userService.me(req);
            return result;
        } catch (error) {
            throw error;
        }
    }

    @AuthOnly()
    @Post('complete-profile')
    async updateCompleteProfile(@Req() req, @Body() dto: CompleteProfileDto) {
        try {
            const result = await this.userService.updateCompleteProfile(req, dto);
            return result;
        } catch (error) {
            throw error;
        }
    }

     @Delete(':id')
     @Public() // Make it public for testing - REMOVE THIS IN PRODUCTION!
     async deleteUser(@Param('id') id: string) {
         const userId = parseInt(id);
         if (isNaN(userId)) {
             throw new BadRequestException('Invalid user ID');
         }
         return await this.userService.deleteUser(userId);
     }

 }
