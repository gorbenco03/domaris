/**
 * 👤 USER DTOs - Data Transfer Objects pentru utilizatori
 */

import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// PROFILE DTOs
// ============================================================================

/**
 * Update profile (general) - Sprint 1 extended
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

  // Sprint 1: Extended address fields
  @ApiPropertyOptional({ example: 'Strada Primăverii 42, Etaj 3, Ap 15' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'București' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'România' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: '010123' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  // Sprint 1: Social links
  @ApiPropertyOptional({ 
    example: { 
      instagram: 'https://instagram.com/john_doe', 
      linkedin: 'https://linkedin.com/in/john_doe',
      website: 'https://johndoe.com'
    } 
  })
  @IsOptional()
  socialLinks?: Record<string, string>;
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Update notification preferences - Sprint 1 extended
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

  // Sprint 1: Quiet hours toggle
  @ApiPropertyOptional({ example: true, description: 'Enable/disable quiet hours' })
  @IsBoolean()
  @IsOptional()
  quietHoursEnabled?: boolean;
}

/**
 * Update quiet hours settings - Sprint 1
 */
export class UpdateQuietHoursDto {
  @ApiPropertyOptional({ example: '22:00', description: 'Quiet hours start time (HH:mm)' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:mm format' })
  start?: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Quiet hours end time (HH:mm)' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:mm format' })
  end?: string;
}

// ============================================================================
// LEGACY (pentru compatibilitate)
// ============================================================================

export class SocialLoginDto {
  @ApiProperty()
  @IsString()
  idToken!: string;
}
