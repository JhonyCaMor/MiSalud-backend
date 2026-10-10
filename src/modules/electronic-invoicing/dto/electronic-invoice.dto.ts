import {
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const INVOICE_STATUSES = [
  'borrador',
  'enviada',
  'aceptada',
  'rechazada',
  'anulada',
] as const;

export class CreateElectronicInvoiceDto {
  @ApiProperty({ example: 5, description: 'Venta a facturar' })
  @IsInt()
  @IsPositive()
  saleId: number;
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: INVOICE_STATUSES })
  @IsIn(INVOICE_STATUSES)
  status: string;

  @ApiPropertyOptional({
    description: 'Respuesta/devolución de DIAN',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  dianResponse?: string;
}
