import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TemperaturaHumidityService } from './temperatura-humidity.service';
import { CreateAmbientReadingDto } from './dto/ambient-reading.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AmbientReading } from './entities/ambient-reading.entity';

@ApiTags('temperature-humidity')
@ApiBearerAuth()
@Controller('temperatura-humidity')
@UseGuards(RolesGuard)
export class TemperaturaHumidityController {
  constructor(private readonly service: TemperaturaHumidityService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AmbientReading[]> {
    return this.service.findAll(user, {
      branchId: branchId ? Number(branchId) : undefined,
      from,
      to,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AmbientReading> {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAmbientReadingDto,
  ): Promise<AmbientReading> {
    return this.service.create(user, dto);
  }
}
