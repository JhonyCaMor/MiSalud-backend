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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Branch } from './entities/branch.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(@CurrentUser() user: AuthUser): Promise<Branch[]> {
    return this.branchesService.findAll(user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Branch> {
    return this.branchesService.findOne(user, id);
  }

  @Get(':id/vendedores')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  findVendedores(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User[]> {
    return this.branchesService.findVendedores(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateBranchDto): Promise<Branch> {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
  ): Promise<Branch> {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number): Promise<Branch> {
    return this.branchesService.remove(id);
  }
}
