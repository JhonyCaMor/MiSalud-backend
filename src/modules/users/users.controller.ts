import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { User } from './entities/user.entity';
import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
} from '../../common/constants/password-policy';

class ResetPasswordDto {
  @ApiProperty({
    example: 'NuevaClave123',
    description: 'Mínimo 8 caracteres, 1 mayúscula y 1 número',
  })
  @IsString()
  @Matches(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE })
  newPassword: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: UsersQueryDto,
  ): Promise<User[]> {
    return this.usersService.findAll(user, query);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    return this.usersService.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateUserDto,
  ): Promise<User> {
    return this.usersService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user, id, dto);
  }

  @Patch(':id/password')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  resetPassword(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ): Promise<User> {
    return this.usersService.resetPassword(user, id, dto.newPassword);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @HttpCode(200)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    return this.usersService.remove(user, id);
  }
}
