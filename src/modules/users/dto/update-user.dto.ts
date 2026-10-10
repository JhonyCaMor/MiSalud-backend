import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiPropertyOptional({
    example: true,
    description: 'Habilitar/deshabilitar usuario',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
