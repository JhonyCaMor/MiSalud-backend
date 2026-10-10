import { PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SANITARY_CATEGORIES = [
  'Medicamento',
  'Dispositivo médico',
  'Insumo',
  'Cosmético',
] as const;

export class CreateSanitaryRecordDto {
  @ApiProperty({ example: '2024MIV-012345', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  invimaCode: string;

  @ApiProperty({ example: 'INVIMA 2024M-012345', maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  resolutionNumber: string;

  @ApiProperty({ example: 'Autorización de comercialización', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  description: string;

  @ApiProperty({ enum: SANITARY_CATEGORIES, example: 'Medicamento' })
  @IsIn(SANITARY_CATEGORIES)
  category: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  issuedAt: string;

  @ApiPropertyOptional({ example: '2031-01-15' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  medicineId?: number;
}

export class UpdateSanitaryRecordDto extends PartialType(
  CreateSanitaryRecordDto,
) {}
