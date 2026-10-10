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
import { ElectronicInvoicingService } from './electronic-invoicing.service';
import {
  CreateElectronicInvoiceDto,
  UpdateInvoiceStatusDto,
} from './dto/electronic-invoice.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ElectronicInvoice } from './entities/electronic-invoice.entity';

@ApiTags('electronic-invoicing')
@ApiBearerAuth()
@Controller('electronic-invoicing')
@UseGuards(RolesGuard)
export class ElectronicInvoicingController {
  constructor(private readonly service: ElectronicInvoicingService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ): Promise<ElectronicInvoice[]> {
    return this.service.findAll(user, { status });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ElectronicInvoice> {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateElectronicInvoiceDto,
  ): Promise<ElectronicInvoice> {
    return this.service.create(user, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceStatusDto,
  ): Promise<ElectronicInvoice> {
    return this.service.updateStatus(id, dto);
  }
}
