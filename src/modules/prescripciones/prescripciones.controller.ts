import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrescripcionesService } from './prescripciones.service';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionStatusDto,
} from './dto/prescription.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Prescription } from './entities/prescription.entity';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescripciones')
@UseGuards(RolesGuard)
export class PrescripcionesController {
  constructor(private readonly service: PrescripcionesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ): Promise<Prescription[]> {
    return this.service.findAll(user, {
      status,
      branchId: branchId ? Number(branchId) : undefined,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Prescription> {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    return this.service.create(user, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrescriptionStatusDto,
  ): Promise<Prescription> {
    return this.service.updateStatus(user, id, dto);
  }
}
