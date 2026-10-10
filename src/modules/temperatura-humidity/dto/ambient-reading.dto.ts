import { PartialType } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAmbientReadingDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'Obligatorio para super_admin y supervisor; el vendedor usa su propia sucursal',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  branchId?: number;

  @ApiPropertyOptional({
    enum: ['ambiente', 'refrigerado'],
    default: 'ambiente',
  })
  @IsIn(['ambiente', 'refrigerado'])
  @IsOptional()
  zone?: string;

  @ApiProperty({ example: 21.5, description: 'Temperatura en °C' })
  @IsNumber()
  @Min(-30)
  @Max(80)
  temperature: number;

  @ApiProperty({ example: 45.2, description: 'Humedad relativa en %' })
  @IsNumber()
  @Min(0)
  @Max(100)
  humidity: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  notes?: string;
}

export class UpdateAmbientReadingDto extends PartialType(
  CreateAmbientReadingDto,
) {}
