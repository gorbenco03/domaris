import {
    IsString,
    IsNumber,
    IsOptional,
    IsDateString,
    IsPositive,
    Min,
} from 'class-validator';

export class ProposeContractDto {
    @IsNumber()
    @IsPositive()
    monthlyRent!: number;

    @IsNumber()
    @Min(0)
    deposit!: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsDateString()
    startDate!: string;

    @IsDateString()
    endDate!: string;

    @IsOptional()
    @IsString()
    terms?: string;
}
