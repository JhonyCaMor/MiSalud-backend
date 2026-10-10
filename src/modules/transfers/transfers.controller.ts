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
import { TransfersService } from './transfers.service';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/transfer.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { StockTransfer } from './entities/transfer.entity';

@ApiTags('transfers')
@ApiBearerAuth()
@Controller('transfers')
@UseGuards(RolesGuard)
export class TransfersController {
  constructor(private readonly service: TransfersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ): Promise<StockTransfer[]> {
    return this.service.findAll(user, { status });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StockTransfer> {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTransferDto,
  ): Promise<StockTransfer> {
    return this.service.create(user, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransferStatusDto,
  ): Promise<StockTransfer> {
    return this.service.changeStatus(user, id, dto);
  }
}
