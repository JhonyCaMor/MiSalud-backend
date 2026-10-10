import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbientReading } from './entities/ambient-reading.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CreateAmbientReadingDto } from './dto/ambient-reading.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { assertBranchAccess } from '../../common/utils/scope.util';

@Injectable()
export class TemperaturaHumidityService {
  constructor(
    @InjectRepository(AmbientReading)
    private readonly readingsRepo: Repository<AmbientReading>,
    @InjectRepository(Branch)
    private readonly branchesRepo: Repository<Branch>,
  ) {}

  async create(
    user: AuthUser,
    dto: CreateAmbientReadingDto,
  ): Promise<AmbientReading> {
    const branchId = user.role === Role.VENDEDOR ? user.branchId : dto.branchId;
    if (!branchId) throw new BadRequestException('branchId es obligatorio');

    const branch = await this.branchesRepo.findOne({
      where: { id: branchId },
    });
    if (!branch)
      throw new NotFoundException(`La sucursal con id ${branchId} no existe`);
    if (user.role === Role.SUPERVISOR && branch.cityId !== user.cityId) {
      throw new ForbiddenException('La sucursal debe pertenecer a tu ciudad');
    }

    const zone = dto.zone ?? 'ambiente';
    const t = dto.temperature;
    const h = dto.humidity;
    // Rangos Res. 1403/2005: refrigerados 2–8 °C; ambiente 15–25 °C y HR 30–70 %
    const inRange =
      zone === 'refrigerado'
        ? t >= 2 && t <= 8
        : t >= 15 && t <= 25 && h >= 30 && h <= 70;

    const reading = this.readingsRepo.create({
      branchId: branch.id,
      zone,
      temperature: t,
      humidity: h,
      inRange,
      notes: dto.notes ?? null,
      recordedById: user.id,
    });
    return this.readingsRepo.save(reading);
  }

  findAll(
    user: AuthUser,
    filters: { branchId?: number; from?: string; to?: string } = {},
  ): Promise<AmbientReading[]> {
    const qb = this.readingsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.branch', 'branch')
      .leftJoinAndSelect('r.recordedBy', 'recordedBy')
      .orderBy('r.recordedAt', 'DESC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('r.branchId = :branchId', { branchId: user.branchId });
    }

    if (filters.branchId) {
      qb.andWhere('r.branchId = :fBranchId', { fBranchId: filters.branchId });
    }
    if (filters.from) {
      qb.andWhere('r.recordedAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('r.recordedAt <= :to', { to: filters.to });
    }

    return qb.getMany();
  }

  async findOne(user: AuthUser, id: number): Promise<AmbientReading> {
    const reading = await this.readingsRepo.findOne({
      where: { id },
      relations: { branch: true, recordedBy: true },
    });
    if (!reading)
      throw new NotFoundException(`Lectura con id ${id} no encontrada`);
    assertBranchAccess(user, {
      branchId: reading.branchId,
      cityId: reading.branch.cityId,
    });
    return reading;
  }
}
