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
  surface?: number; // mp

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  photos?: string[];

  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;
}

export class UpdateListingDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

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
  surface?: number;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  photos?: string[];

  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;
}
