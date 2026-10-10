import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  medicineId: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateTransferDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  fromBranchId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  toBranchId: number;

  @ApiProperty({ type: [TransferItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  notes?: string;
}

export class UpdateTransferStatusDto {
  @ApiProperty({ enum: ['en_transito', 'recibido', 'cancelado'] })
  @IsIn(['en_transito', 'recibido', 'cancelado'])
  status: string;
}
