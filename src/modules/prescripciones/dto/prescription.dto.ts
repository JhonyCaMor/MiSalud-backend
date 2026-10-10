import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'FM-2026-001', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  prescriptionNumber: string;

  @ApiProperty({ example: 'Dra. María Gómez' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  doctorName: string;

  @ApiProperty({ example: 'MED-123456', description: 'Registro profesional' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  doctorLicense: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  patientName: string;

  @ApiProperty({ example: '1098765432' })
  @IsString()
  @Matches(/^\d{3,15}$/, {
    message: 'Documento debe tener entre 3 y 15 dígitos',
  })
  patientDocument: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Obligatorio para super_admin y supervisor',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  branchId?: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  notes?: string;
}

export class UpdatePrescriptionStatusDto {
  @ApiProperty({ enum: ['activa', 'retenida', 'anulada'] })
  @IsIn(['activa', 'retenida', 'anulada'])
  status: string;

  @ApiPropertyOptional({
    description: 'Obligatorio al retenar la fórmula',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  retainedReason?: string;
}
