import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { assertBranchAccess } from '../../common/utils/scope.util';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchesRepo: Repository<Batch>,
    @InjectRepository(Branch)
    private readonly branchesRepo: Repository<Branch>,
    @InjectRepository(Medicine)
    private readonly medicinesRepo: Repository<Medicine>,
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    user: AuthUser,
    filters: { branchId?: number; medicineId?: number } = {},
  ): Promise<Batch[]> {
    const qb = this.batchesRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.medicine', 'medicine')
      .leftJoinAndSelect('b.supplier', 'supplier')
      .leftJoinAndSelect('b.branch', 'branch')
      .leftJoinAndSelect('b.registeredBy', 'registeredBy')
      .orderBy('b.createdAt', 'DESC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('b.branchId = :branchId', { branchId: user.branchId });
    }

    if (filters.branchId) {
      const branch = await this.branchesRepo.findOne({
        where: { id: filters.branchId },
      });
      if (!branch)
        throw new NotFoundException(
          `Sucursal con id ${filters.branchId} no existe`,
        );
      assertBranchAccess(user, { branchId: branch.id, cityId: branch.cityId });
      qb.andWhere('b.branchId = :fBranchId', { fBranchId: branch.id });
    }
    if (filters.medicineId) {
      qb.andWhere('b.medicineId = :medicineId', {
        medicineId: filters.medicineId,
      });
    }

    return qb.getMany();
  }

  async findOne(user: AuthUser, id: number): Promise<Batch> {
    const batch = await this.batchesRepo.findOne({
      where: { id },
      relations: {
        medicine: true,
        supplier: true,
        branch: true,
        registeredBy: true,
      },
    });
    if (!batch) throw new NotFoundException(`Lote con id ${id} no encontrado`);
    assertBranchAccess(user, {
      branchId: batch.branchId,
      cityId: batch.branch.cityId,
    });
    return batch;
  }

  async create(user: AuthUser, dto: CreateBatchDto): Promise<Batch> {
    const branch = await this.branchesRepo.findOne({
      where: { id: dto.branchId },
    });
    if (!branch)
      throw new NotFoundException(
        `La sucursal con id ${dto.branchId} no existe`,
      );
    if (!branch.isActive)
      throw new ForbiddenException('La sucursal está inactiva');
    assertBranchAccess(user, { branchId: branch.id, cityId: branch.cityId });

    const medicine = await this.medicinesRepo.findOne({
      where: { id: dto.medicineId },
    });
    if (!medicine)
      throw new NotFoundException(
        `El medicamento con id ${dto.medicineId} no existe`,
      );
    if (!medicine.isActive)
      throw new ForbiddenException('El medicamento está inactivo');

    const supplier = await this.suppliersRepo.findOne({
      where: { id: dto.supplierId },
    });
    if (!supplier)
      throw new NotFoundException(
        `El proveedor con id ${dto.supplierId} no existe`,
      );
    if (!supplier.isActive)
      throw new ForbiddenException('El proveedor está inactivo');

    const today = new Date().toISOString().slice(0, 10);
    if (dto.expirationDate.slice(0, 10) <= today) {
      throw new BadRequestException('La fecha de vencimiento debe ser futura');
    }

    const duplicated = await this.batchesRepo.findOne({
      where: { code: dto.code, branchId: branch.id },
    });
    if (duplicated) {
      throw new ConflictException(
        `El código de lote "${dto.code}" ya existe en la sucursal "${branch.name}". ` +
          'En otra sucursal sí puede reutilizarse.',
      );
    }

    return this.dataSource.transaction(async (em) => {
      const batch = em.create(Batch, {
        code: dto.code,
        medicineId: medicine.id,
        supplierId: supplier.id,
        branchId: branch.id,
        expirationDate: dto.expirationDate.slice(0, 10),
        quantityInitial: dto.quantityInitial,
        quantityRemaining: dto.quantityInitial,
        unitCost: dto.unitCost,
        notes: dto.notes ?? null,
        registeredById: user.id,
      });
      const saved = await em.save(batch);
      await this.applyInventoryMovement(
        em,
        medicine.id,
        branch.id,
        dto.quantityInitial,
      );

      const created = await em.findOne(Batch, {
        where: { id: saved.id },
        relations: {
          medicine: true,
          supplier: true,
          branch: true,
          registeredBy: true,
        },
      });
      return created as Batch;
    });
  }

  async update(
    user: AuthUser,
    id: number,
    dto: UpdateBatchDto,
  ): Promise<Batch> {
    const batch = await this.findOne(user, id);

    if (dto.expirationDate !== undefined) {
      const today = new Date().toISOString().slice(0, 10);
      if (dto.expirationDate.slice(0, 10) <= today) {
        throw new BadRequestException(
          'La fecha de vencimiento debe ser futura',
        );
      }
      batch.expirationDate = dto.expirationDate.slice(0, 10);
    }
    if (dto.unitCost !== undefined) batch.unitCost = dto.unitCost;
    if (dto.notes !== undefined) batch.notes = dto.notes ?? null;

    if (dto.isActive === false && batch.isActive) {
      return this.voidBatch(batch.id);
    }
    if (dto.isActive === true && !batch.isActive) {
      throw new ConflictException(
        'Un lote anulado no puede reactivarse; ingresa un nuevo lote',
      );
    }

    return this.batchesRepo.save(batch);
  }

  async remove(user: AuthUser, id: number): Promise<Batch> {
    const batch = await this.findOne(user, id);
    if (!batch.isActive) return batch;
    return this.voidBatch(batch.id);
  }

  private async voidBatch(batchId: number): Promise<Batch> {
    return this.dataSource.transaction(async (em) => {
      const batch = await em.findOne(Batch, {
        where: { id: batchId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!batch) throw new NotFoundException('Lote no encontrado');
      if (!batch.isActive) return batch;

      batch.isActive = false;
      if (batch.quantityRemaining > 0) {
        await this.applyInventoryMovement(
          em,
          batch.medicineId,
          batch.branchId,
          -batch.quantityRemaining,
        );
        batch.quantityRemaining = 0;
      }
      await em.save(batch);

      const reloaded = await em.findOne(Batch, {
        where: { id: batchId },
        relations: {
          medicine: true,
          supplier: true,
          branch: true,
          registeredBy: true,
        },
      });
      return reloaded as Batch;
    });
  }

  /** Actualiza la tabla pivote de inventario por sucursal (+/-). */
  async applyInventoryMovement(
    em: EntityManager,
    medicineId: number,
    branchId: number,
    delta: number,
  ): Promise<void> {
    let item = await em.findOne(InventoryItem, {
      where: { medicineId, branchId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!item) {
      item = em.create(InventoryItem, {
        medicineId,
        branchId,
        quantityAvailable: 0,
        lastMovementAt: null,
      });
    }
    const next = item.quantityAvailable + delta;
    if (next < 0) {
      throw new ConflictException(
        'El inventario de la sucursal no puede quedar negativo',
      );
    }
    item.quantityAvailable = next;
    item.lastMovementAt = new Date();
    await em.save(item);
  }

  async findAvailableByMedicine(
    user: AuthUser,
    medicineId: number,
  ): Promise<Batch[]> {
    const qb = this.batchesRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.branch', 'branch')
      .leftJoinAndSelect('b.supplier', 'supplier')
      .where('b.medicineId = :medicineId', { medicineId })
      .andWhere('b.isActive = true')
      .andWhere('b.quantityRemaining > 0')
      .orderBy('b.expirationDate', 'ASC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('b.branchId = :branchId', { branchId: user.branchId });
    }
    return qb.getMany();
  }
}
