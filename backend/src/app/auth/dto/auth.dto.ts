import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    password?: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty({ enum: ['tenant', 'landlord', 'admin'], default: 'tenant' })
    @IsEnum(['tenant', 'landlord', 'admin'])
    @IsOptional()
    userType?: 'tenant' | 'landlord' | 'admin';
}

export class LoginDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    password: string;
}

export class GoogleAuthDto {
    @ApiProperty()
    @IsString()
    idToken: string;
}

export class AppleAuthDto {
    @ApiProperty()
    @IsString()
    identityToken: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fullName?: string; // Optional, sent only on first login
}
