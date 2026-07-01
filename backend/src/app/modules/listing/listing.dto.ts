import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsUrl,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  // Location fields — optional, provided by map pin or address geocoding
  @IsString()
  @IsOptional()
  addressText?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lng?: number;

  @IsString()
  @IsOptional()
  transactionType?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string; // "EUR", "RON", etc.

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  area?: string; // cartier / zonă

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bathrooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  floor?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalFloors?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  yearBuilt?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  surface?: number; // mp

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  photos?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCentralHeating?: boolean;

  @IsBoolean()
  @IsOptional()
  petFriendly?: boolean;
}

export class UpdateListingDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Location fields
  @IsString()
  @IsOptional()
  addressText?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lng?: number;

  @IsString()
  @IsOptional()
  transactionType?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bathrooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  floor?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalFloors?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  yearBuilt?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  surface?: number;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  photos?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCentralHeating?: boolean;

  @IsBoolean()
  @IsOptional()
  petFriendly?: boolean;
}
