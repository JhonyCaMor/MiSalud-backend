import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({
    example: 'LT-2026-001',
    description:
      'Código del lote. No puede repetirse en la misma sucursal (sí en otra).',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9-]{3,30}$/, {
    message:
      'El código de lote solo puede contener letras, números y guiones (3-30)',
  })
  code: string;

  @ApiProperty({ example: 1, description: 'Medicamento del lote' })
  @IsInt()
  @IsPositive()
  medicineId: number;

  @ApiProperty({ example: 1, description: 'Proveedor del lote' })
  @IsInt()
  @IsPositive()
  supplierId: number;

  @ApiProperty({ example: 1, description: 'Sucursal donde se recibe el lote' })
  @IsInt()
  @IsPositive()
  branchId: number;

  @ApiProperty({
    example: '2027-06-30',
    description: 'Fecha de vencimiento (ISO, futura)',
  })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({ example: 100, description: 'Cantidad ingresada' })
  @IsInt()
  @IsPositive()
  quantityInitial: number;

  @ApiProperty({ example: 3500.5, description: 'Costo unitario' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ example: 'Orden de compra OC-1234' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  notes?: string;
}
