import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateBatchDto } from './create-batch.dto';

export class UpdateBatchDto extends PartialType(
  OmitType(CreateBatchDto, ['code', 'branchId', 'quantityInitial'] as const),
) {
  @ApiPropertyOptional({ example: true, description: 'Activo/anulado' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
