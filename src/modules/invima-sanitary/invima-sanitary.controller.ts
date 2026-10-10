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
import { InvimaSanitaryService } from './invima-sanitary.service';
import {
  CreateSanitaryRecordDto,
  UpdateSanitaryRecordDto,
} from './dto/sanitary-record.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SanitaryRecord } from './entities/sanitary-record.entity';

@ApiTags('invima-sanitary')
@ApiBearerAuth()
@Controller('invima-sanitary')
@UseGuards(RolesGuard)
export class InvimaSanitaryController {
  constructor(private readonly service: InvimaSanitaryService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findAll(
    @Query('search') search?: string,
    @Query('active') active?: string,
  ): Promise<SanitaryRecord[]> {
    return this.service.findAll({ search, active });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR, Role.VENDEDOR)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SanitaryRecord> {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateSanitaryRecordDto): Promise<SanitaryRecord> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSanitaryRecordDto,
  ): Promise<SanitaryRecord> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(200)
  remove(@Param('id', ParseIntPipe) id: number): Promise<SanitaryRecord> {
    return this.service.remove(id);
  }
}
