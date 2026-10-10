import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicineDto {
  @ApiProperty({
    example: 'MED-0001',
    required: false,
    description: 'Código interno (auto si se omite)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @ApiProperty({ example: 'Paracetamol Tableta 500 mg' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'Paracetamol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  activeIngredient: string;

  @ApiProperty({ example: '500 mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  concentration: string;

  @ApiProperty({ example: 'Tableta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  presentation: string;

  @ApiPropertyOptional({ example: 'Analgésico' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  category?: string;

  @ApiProperty({
    example: 'INVIMA2024M-001234',
    description: 'Número de registro INVIMA',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^INVIMA\d{4}[A-Z]-\d{6}$/, {
    message: 'El número INVIMA debe tener el formato INVIMA2024M-001234',
  })
  @MaxLength(40)
  invimaNumber: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Requiere prescripción médica',
  })
  @IsBoolean()
  @IsOptional()
  requiresPrescription?: boolean;
}
