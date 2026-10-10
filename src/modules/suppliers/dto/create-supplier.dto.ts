import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: '900123456-1', description: 'NIT del proveedor' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6,10}-?\d$/, {
    message: 'El NIT debe tener el formato 900123456-1',
  })
  nit: string;

  @ApiProperty({ example: 'Distribuidora Nacional de Medicamentos' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Cra 13 #45-67, Cali' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: '+57 602 5555555' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'ventas@proveedor.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(120)
  email?: string;
}
