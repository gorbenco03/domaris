/**
 * 🔒 CONSENT DTOs - GDPR Consent Management
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsBoolean } from 'class-validator';
import { ConsentType } from '../../db/entities/user-consent.entity.js';

/**
 * DTO for withdrawing consent
 */
export class WithdrawConsentDto {
  @ApiProperty({
    enum: ConsentType,
    description: 'Type of consent to withdraw (MARKETING or ANALYTICS only)',
    example: ConsentType.MARKETING
  })
  @IsEnum(ConsentType)
  consentType!: ConsentType;
}

/**
 * DTO for granting consent
 */
export class GrantConsentDto {
  @ApiProperty({
    enum: ConsentType,
    description: 'Type of consent to grant',
    example: ConsentType.MARKETING
  })
  @IsEnum(ConsentType)
  consentType!: ConsentType;
}

/**
 * DTO for updating optional consents
 */
export class UpdateConsentsDto {
  @ApiProperty({
    description: 'Consent for marketing communications',
    example: true,
    required: false
  })
  @IsBoolean()
  acceptMarketing?: boolean;

  @ApiProperty({
    description: 'Consent for analytics tracking',
    example: false,
    required: false
  })
  @IsBoolean()
  acceptAnalytics?: boolean;
}
