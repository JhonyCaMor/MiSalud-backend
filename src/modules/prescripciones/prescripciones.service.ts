import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { Branch } from '../branches/entities/branch.entity';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionStatusDto,
} from './dto/prescription.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { assertBranchAccess } from '../../common/utils/scope.util';

@Injectable()
export class PrescripcionesService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionsRepo: Repository<Prescription>,
    @InjectRepository(Branch)
    private readonly branchesRepo: Repository<Branch>,
  ) {}

  async create(
    user: AuthUser,
    dto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    const branchId = user.role === Role.VENDEDOR ? user.branchId : dto.branchId;
    if (!branchId) throw new BadRequestException('branchId es obligatorio');

    const branch = await this.branchesRepo.findOne({ where: { id: branchId } });
    if (!branch)
      throw new NotFoundException(`La sucursal con id ${branchId} no existe`);
    if (user.role === Role.SUPERVISOR && branch.cityId !== user.cityId) {
      throw new ForbiddenException('La sucursal debe pertenecer a tu ciudad');
    }

    const existing = await this.prescriptionsRepo.findOne({
      where: { prescriptionNumber: dto.prescriptionNumber },
    });
    if (existing)
      throw new ConflictException(
        `La fórmula "${dto.prescriptionNumber}" ya está registrada`,
      );

    const prescription = this.prescriptionsRepo.create({
      prescriptionNumber: dto.prescriptionNumber,
      doctorName: dto.doctorName,
      doctorLicense: dto.doctorLicense,
      patientName: dto.patientName,
      patientDocument: dto.patientDocument,
      branchId: branch.id,
      sellerId: user.id,
      status: 'activa',
      notes: dto.notes ?? null,
    });
    return this.prescriptionsRepo.save(prescription);
  }

  findAll(
    user: AuthUser,
    filters: { status?: string; branchId?: number } = {},
  ): Promise<Prescription[]> {
    const qb = this.prescriptionsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.branch', 'branch')
      .leftJoinAndSelect('p.seller', 'seller')
      .orderBy('p.createdAt', 'DESC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('p.branchId = :branchId', { branchId: user.branchId });
    }

    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters.branchId) {
      qb.andWhere('p.branchId = :fBranchId', { fBranchId: filters.branchId });
    }

    return qb.getMany();
  }

  async findOne(user: AuthUser, id: number): Promise<Prescription> {
    const prescription = await this.prescriptionsRepo.findOne({
      where: { id },
      relations: { branch: true, seller: true },
    });
    if (!prescription)
      throw new NotFoundException(`La fórmula con id ${id} no existe`);
    assertBranchAccess(user, {
      branchId: prescription.branchId,
      cityId: prescription.branch.cityId,
    });
    return prescription;
  }

  async updateStatus(
    user: AuthUser,
    id: number,
    dto: UpdatePrescriptionStatusDto,
  ): Promise<Prescription> {
    const prescription = await this.findOne(user, id);
    if (dto.status === 'retenida' && !dto.retainedReason) {
      throw new BadRequestException(
        'Al retenar la fórmula debe indicar el motivo',
      );
    }
    prescription.status = dto.status;
    prescription.retainedAt = dto.status === 'retenida' ? new Date() : null;
    prescription.retainedReason =
      dto.status === 'retenida' ? (dto.retainedReason ?? null) : null;
    return this.prescriptionsRepo.save(prescription);
  }
}
