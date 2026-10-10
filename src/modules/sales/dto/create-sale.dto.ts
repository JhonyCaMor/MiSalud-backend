import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleItemDto {
  @ApiProperty({ example: 1, description: 'Medicamento vendido' })
  @IsInt()
  @IsPositive()
  medicineId: number;

  @ApiProperty({
    example: 2,
    description: 'Cantidad a vender (debe existir en la sucursal)',
  })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 2500.5, description: 'Precio unitario de venta' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({
    example: 'María Gómez',
    description: 'Cliente (opcional)',
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  customerName?: string;

  @ApiProperty({
    type: [SaleItemDto],
    description:
      'Ítems de la venta; el stock se valida contra la sucursal del vendedor',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
