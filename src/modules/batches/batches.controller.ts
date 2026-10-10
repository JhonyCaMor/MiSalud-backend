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
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Batch } from './entities/batch.entity';

@ApiTags('batches')
@ApiBearerAuth()
@Controller('batches')
@UseGuards(RolesGuard)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
    @Query('medicineId') medicineId?: string,
  ): Promise<Batch[]> {
    return this.batchesService.findAll(user, {
      branchId: branchId ? Number(branchId) : undefined,
      medicineId: medicineId ? Number(medicineId) : undefined,
    });
  }

  @Get('medicine/:medicineId')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findByMedicine(
    @CurrentUser() user: AuthUser,
    @Param('medicineId', ParseIntPipe) medicineId: number,
  ): Promise<Batch[]> {
    return this.batchesService.findAvailableByMedicine(user, medicineId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Batch> {
    return this.batchesService.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBatchDto,
  ): Promise<Batch> {
    return this.batchesService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBatchDto,
  ): Promise<Batch> {
    return this.batchesService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @HttpCode(200)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Batch> {
    return this.batchesService.remove(user, id);
  }
}
