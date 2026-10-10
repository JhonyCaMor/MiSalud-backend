import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const REPORT_SEVERITIES = ['leve', 'moderado', 'grave'] as const;
export const REPORT_STATUSES = [
  'recibido',
  'en_revision',
  'enviado_invima',
  'cerrado',
] as const;

export class CreateAdverseEventReportDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  medicineId: number;

  @ApiPropertyOptional({ example: 5, description: 'Venta relacionada' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  saleId?: number;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  patientName: string;

  @ApiProperty({
    example: 'Presentó erupción cutánea 2 horas después de la dosis',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ enum: REPORT_SEVERITIES, default: 'leve' })
  @IsIn(REPORT_SEVERITIES)
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Obligatorio para super_admin y supervisor; el vendedor usa su sucursal',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  branchId?: number;
}

export class UpdateReportStatusDto {
  @ApiProperty({ enum: REPORT_STATUSES })
  @IsIn(REPORT_STATUSES)
  status: string;
}
