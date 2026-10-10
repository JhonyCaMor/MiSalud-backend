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
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Medicine } from './entities/medicine.entity';

@ApiTags('medicines')
@ApiBearerAuth()
@Controller('medicines')
@UseGuards(RolesGuard)
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ): Promise<Medicine[]> {
    return this.medicinesService.findAll(search, category);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Medicine> {
    return this.medicinesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  create(@Body() dto: CreateMedicineDto): Promise<Medicine> {
    return this.medicinesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicineDto,
  ): Promise<Medicine> {
    return this.medicinesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number): Promise<Medicine> {
    return this.medicinesService.remove(id);
  }
}
