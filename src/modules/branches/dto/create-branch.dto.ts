import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'MiSalud Cali Centro' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'Av. 6 Norte #12-34, Cali', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiProperty({
    example: 1,
    description: 'ID de la ciudad a la que pertenece',
  })
  @IsInt()
  @IsPositive()
  cityId: number;
}
