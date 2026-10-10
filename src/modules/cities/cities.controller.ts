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
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { assertCityAccess } from '../../common/utils/scope.util';
import { City } from './entities/city.entity';

@ApiTags('cities')
@ApiBearerAuth()
@Controller('cities')
@UseGuards(RolesGuard)
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  findAll(@CurrentUser() user: AuthUser): Promise<City[]> {
    return this.citiesService.findAll(user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<City> {
    const city = await this.citiesService.findOne(id);
    assertCityAccess(user, city.id);
    return city;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateCityDto): Promise<City> {
    return this.citiesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCityDto,
  ): Promise<City> {
    return this.citiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number): Promise<City> {
    return this.citiesService.remove(id);
  }
}
