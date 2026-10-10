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
import { PharmacovigilanceService } from './pharmacovigilance.service';
import {
  CreateAdverseEventReportDto,
  UpdateReportStatusDto,
} from './dto/adverse-event-report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AdverseEventReport } from './entities/adverse-event-report.entity';

@ApiTags('pharmacovigilance')
@ApiBearerAuth()
@Controller('pharmacovigilance')
@UseGuards(RolesGuard)
export class PharmacovigilanceController {
  constructor(private readonly service: PharmacovigilanceService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('medicineId') medicineId?: string,
  ): Promise<AdverseEventReport[]> {
    return this.service.findAll(user, {
      status,
      branchId: branchId ? Number(branchId) : undefined,
      medicineId: medicineId ? Number(medicineId) : undefined,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdverseEventReport> {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAdverseEventReportDto,
  ): Promise<AdverseEventReport> {
    return this.service.create(user, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportStatusDto,
  ): Promise<AdverseEventReport> {
    return this.service.updateStatus(user, id, dto);
  }
}
