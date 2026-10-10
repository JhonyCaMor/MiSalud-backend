import {
  IsEmail,
  IsEnum,
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
import { Role } from '../../../common/enums/role.enum';
import {
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
} from '../../../common/constants/password-policy';

export class CreateUserDto {
  @ApiProperty({ example: 'vendedor.cali@misalud.com' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({
    example: 'Vendedor123!',
    description: 'Mínimo 8 caracteres, al menos 1 mayúscula y 1 número',
  })
  @IsString()
  @Matches(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE })
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({
    enum: Role,
    example: Role.VENDEDOR,
    description: 'super_admin | supervisor | vendedor',
  })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    example: 1,
    description: 'Obligatorio si role=supervisor (ciudad a supervisar)',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  cityId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Obligatorio si role=vendedor (sucursal de venta)',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  branchId?: number;
}
