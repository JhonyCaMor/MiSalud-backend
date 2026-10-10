import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
} from '../../../common/constants/password-policy';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual del usuario' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description:
      'Nueva contraseña: mínimo 8 caracteres, 1 mayúscula y 1 número',
    example: 'NuevaClave123',
  })
  @IsString()
  @Matches(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE })
  newPassword: string;
}
