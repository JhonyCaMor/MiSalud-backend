import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { InventoryItem } from './entities/inventory-item.entity';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ): Promise<InventoryItem[]> {
    const parsedBranch = branchId ? Number(branchId) : undefined;
    if (
      parsedBranch &&
      user.role !== Role.SUPER_ADMIN &&
      parsedBranch !== user.branchId
    ) {
      throw new ForbiddenException('No tienes acceso a esa sucursal');
    }
    return this.inventoryService.findAll(user, {
      branchId: parsedBranch,
      search,
    });
  }
}
