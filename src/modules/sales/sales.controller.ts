import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Sale } from './entities/sale.entity';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.VENDEDOR)
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSaleDto,
  ): Promise<Sale> {
    return this.salesService.create(user, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<Sale[]> {
    return this.salesService.findAll(user, {
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
  ): Promise<Sale> {
    return this.salesService.findOne(user, id);
  }
}
