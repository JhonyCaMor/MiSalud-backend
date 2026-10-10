import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdverseEventReport } from './entities/adverse-event-report.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { Sale } from '../sales/entities/sale.entity';
import {
  CreateAdverseEventReportDto,
  UpdateReportStatusDto,
} from './dto/adverse-event-report.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { assertBranchAccess } from '../../common/utils/scope.util';

@Injectable()
export class PharmacovigilanceService {
  constructor(
    @InjectRepository(AdverseEventReport)
    private readonly reportsRepo: Repository<AdverseEventReport>,
    @InjectRepository(Branch)
    private readonly branchesRepo: Repository<Branch>,
    @InjectRepository(Medicine)
    private readonly medicinesRepo: Repository<Medicine>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
  ) {}

  async create(
    user: AuthUser,
    dto: CreateAdverseEventReportDto,
  ): Promise<AdverseEventReport> {
    const branchId = user.role === Role.VENDEDOR ? user.branchId : dto.branchId;
    if (!branchId) throw new BadRequestException('branchId es obligatorio');

    const branch = await this.branchesRepo.findOne({ where: { id: branchId } });
    if (!branch)
      throw new NotFoundException(`La sucursal con id ${branchId} no existe`);
    if (user.role === Role.SUPERVISOR && branch.cityId !== user.cityId) {
      throw new ForbiddenException('La sucursal debe pertenecer a tu ciudad');
    }

    const medicine = await this.medicinesRepo.findOne({
      where: { id: dto.medicineId },
    });
    if (!medicine || !medicine.isActive)
      throw new NotFoundException(
        `El medicamento con id ${dto.medicineId} no existe o está inactivo`,
      );

    if (dto.saleId) {
      const sale = await this.salesRepo.findOne({ where: { id: dto.saleId } });
      if (!sale)
        throw new NotFoundException(`La venta con id ${dto.saleId} no existe`);
    }

    const report = this.reportsRepo.create({
      medicineId: dto.medicineId,
      saleId: dto.saleId ?? null,
      patientName: dto.patientName,
      description: dto.description,
      severity: dto.severity ?? 'leve',
      status: 'recibido',
      branchId: branch.id,
      reportedById: user.id,
    });
    return this.reportsRepo.save(report);
  }

  findAll(
    user: AuthUser,
    filters: { status?: string; branchId?: number; medicineId?: number } = {},
  ): Promise<AdverseEventReport[]> {
    const qb = this.reportsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.medicine', 'medicine')
      .leftJoinAndSelect('r.branch', 'branch')
      .leftJoinAndSelect('r.reportedBy', 'reportedBy')
      .leftJoinAndSelect('r.sale', 'sale')
      .orderBy('r.createdAt', 'DESC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('r.branchId = :branchId', { branchId: user.branchId });
    }

    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    if (filters.branchId) {
      qb.andWhere('r.branchId = :fBranchId', { fBranchId: filters.branchId });
    }
    if (filters.medicineId) {
      qb.andWhere('r.medicineId = :medicineId', {
        medicineId: filters.medicineId,
      });
    }

    return qb.getMany();
  }

  async findOne(user: AuthUser, id: number): Promise<AdverseEventReport> {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: { medicine: true, branch: true, reportedBy: true, sale: true },
    });
    if (!report)
      throw new NotFoundException(`El reporte con id ${id} no existe`);
    assertBranchAccess(user, {
      branchId: report.branchId,
      cityId: report.branch.cityId,
    });
    return report;
  }

  async updateStatus(
    user: AuthUser,
    id: number,
    dto: UpdateReportStatusDto,
  ): Promise<AdverseEventReport> {
    const report = await this.findOne(user, id);
    report.status = dto.status;
    return this.reportsRepo.save(report);
  }
}
