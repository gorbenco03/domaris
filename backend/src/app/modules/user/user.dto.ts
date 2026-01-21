/**
 * 👤 USER DTOs - Data Transfer Objects pentru utilizatori
 */

import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  ValidateNested,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================================================
// PROFILE DTOs
// ============================================================================

/**
 * Update profile (general)
 */
export class CompleteProfileDto {
  @ApiPropertyOptional({ example: 'Ion Popescu', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: 'Ion' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Popescu' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Agent imobiliar cu 5 ani experiență' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'București, România' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: '+40712345678' })
  @IsString()
  @IsOptional()
  phone?: string;
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Update notification preferences
 */
export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  marketing?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  newMessages?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  viewingReminders?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  priceDrops?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  newListingsAlerts?: boolean;
}

// ============================================================================
// LEGACY (pentru compatibilitate)
// ============================================================================

export class SocialLoginDto {
  @ApiProperty()
  @IsString()
  idToken!: string;
}
