import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, GoogleAuthDto, AppleAuthDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register with email and password' })
    @ApiResponse({ status: 201, description: 'User created' })
    async register(@Body() body: RegisterDto) {
        return this.authService.register(body);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'JWT tokens' })
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('oauth/google')
    @ApiOperation({ summary: 'Login with Google' })
    async googleAuth(@Body() body: GoogleAuthDto) {
        return this.authService.googleLogin(body.idToken);
    }

    @Post('oauth/apple')
    @ApiOperation({ summary: 'Login with Apple' })
    async appleAuth(@Body() body: AppleAuthDto) {
        return this.authService.appleLogin(body);
    }
}
