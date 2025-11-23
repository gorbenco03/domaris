import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Folosit la:
 * POST /user/google
 * POST /user/apple
 */
export class SocialLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

/**
 * Folosit la:
 * POST /user/complete-profile
 * pentru onboarding-ul proprietarilor care vor să posteze anunțuri
 */
export class CompleteProfileDto {
  // -----------------------------
  // STEP 1 — IDENTITATE
  // -----------------------------

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @IsPhoneNumber('RO')
  @IsNotEmpty()
  phoneNumber: string;

  // -----------------------------
  // STEP 2 — TIP PROPRIETAR
  // -----------------------------

  @IsEnum(['individual', 'company', 'agency'], {
    message: 'ownerType must be one of: individual, company, agency',
  })
  ownerType: 'individual' | 'company' | 'agency';

  @IsString()
  @IsOptional()
  @MaxLength(150)
  companyName?: string;

  // -----------------------------
  // STEP 3 — PREFERINȚE LISTĂRI
  // -----------------------------

  @IsBoolean()
  @IsOptional()
  petFriendlyDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  longTermOnlyDefault?: boolean;

  @IsEnum(['female', 'male', 'any'], {
    message: 'genderPreferenceDefault must be female, male or any',
  })
  @IsOptional()
  genderPreferenceDefault?: 'female' | 'male' | 'any';

  // -----------------------------
  // METODE CONTACT ACCEPTATE
  // -----------------------------

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @IsEnum(['phone', 'whatsapp', 'chat', 'email'], {
    each: true,
    message: 'allowedContacts must contain only: phone, whatsapp, chat, email',
  })
  allowedContacts: ('phone' | 'whatsapp' | 'chat' | 'email')[];

  // -----------------------------
  // STEP 4 — OPTIONAL (FISCAL / PLĂȚI)
  // -----------------------------

  @IsString()
  @IsOptional()
  @MaxLength(34)
  iban?: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  billingAddress?: string;
}
