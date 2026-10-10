import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { StockTransfer, TransferItem } from './entities/transfer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { Batch } from '../batches/entities/batch.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/transfer.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

const TRANSITIONS: Record<string, string[]> = {
  pendiente: ['en_transito', 'cancelado'],
  en_transito: ['recibido', 'cancelado'],
};

const TRANSFER_RELATIONS = {
  fromBranch: true,
  toBranch: true,
  items: { medicine: true },
} as const;

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(StockTransfer)
    private readonly transfersRepo: Repository<StockTransfer>,
    @InjectRepository(Branch)
    private readonly branchesRepo: Repository<Branch>,
    @InjectRepository(Medicine)
    private readonly medicinesRepo: Repository<Medicine>,
    private readonly dataSource: DataSource,
  ) {}

  async create(user: AuthUser, dto: CreateTransferDto): Promise<StockTransfer> {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException(
        'La sucursal de origen y destino deben ser distintas',
      );
    }
    const branches = await this.branchesRepo.find({
      where: { id: In([dto.fromBranchId, dto.toBranchId]) },
    });
    if (branches.length !== 2) {
      throw new NotFoundException('La sucursal de origen o destino no existe');
    }
    if (
      user.role === Role.SUPERVISOR &&
      branches.some((b) => b.cityId !== user.cityId)
    ) {
      throw new ForbiddenException(
        'Ambas sucursales deben pertenecer a tu ciudad',
      );
    }

    const medicineIds = dto.items.map((i) => i.medicineId);
    if (new Set(medicineIds).size !== medicineIds.length) {
      throw new BadRequestException('Hay medicamentos duplicados en los ítems');
    }
    const medicines = await this.medicinesRepo.find({
      where: { id: In(medicineIds), isActive: true },
    });
    if (medicines.length !== medicineIds.length) {
      throw new NotFoundException(
        'Algún medicamento no existe o está inactivo',
      );
    }

    const transfer = this.transfersRepo.create({
      fromBranchId: dto.fromBranchId,
      toBranchId: dto.toBranchId,
      status: 'pendiente',
      notes: dto.notes ?? null,
      createdById: user.id,
      receivedById: null,
    });
    await this.transfersRepo.save(transfer);

    const items = dto.items.map((i) =>
      this.dataSource.manager.create(TransferItem, {
        transferId: transfer.id,
        medicineId: i.medicineId,
        quantity: i.quantity,
      }),
    );
    await this.dataSource.manager.save(items);

    return (await this.transfersRepo.findOne({
      where: { id: transfer.id },
      relations: TRANSFER_RELATIONS,
    })) as StockTransfer;
  }

  findAll(
    user: AuthUser,
    filters: { status?: string } = {},
  ): Promise<StockTransfer[]> {
    const qb = this.transfersRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.fromBranch', 'fromBranch')
      .leftJoinAndSelect('t.toBranch', 'toBranch')
      .leftJoinAndSelect('t.items', 'item')
      .leftJoinAndSelect('item.medicine', 'medicine')
      .orderBy('t.createdAt', 'DESC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('fromBranch.cityId = :cityId AND toBranch.cityId = :cityId', {
        cityId: user.cityId,
      });
    }
    if (filters.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }

    return qb.getMany();
  }

  async findOne(user: AuthUser, id: number): Promise<StockTransfer> {
    const transfer = await this.transfersRepo.findOne({
      where: { id },
      relations: TRANSFER_RELATIONS,
    });
    if (!transfer)
      throw new NotFoundException(`El traslado con id ${id} no existe`);
    this.assertScope(user, transfer);
    return transfer;
  }

  async changeStatus(
    user: AuthUser,
    id: number,
    dto: UpdateTransferStatusDto,
  ): Promise<StockTransfer> {
    return this.dataSource.transaction(async (em) => {
      const transfer = await em.findOne(StockTransfer, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!transfer)
        throw new NotFoundException(`El traslado con id ${id} no existe`);

      const from = await em.findOne(Branch, {
        where: { id: transfer.fromBranchId },
      });
      const to = await em.findOne(Branch, {
        where: { id: transfer.toBranchId },
      });
      this.assertScope(user, {
        ...transfer,
        fromBranch: from as Branch,
        toBranch: to as Branch,
      });

      if (!(TRANSITIONS[transfer.status] ?? []).includes(dto.status)) {
        throw new BadRequestException(
          `No se puede cambiar de "${transfer.status}" a "${dto.status}"`,
        );
      }

      const items = await em.find(TransferItem, {
        where: { transferId: transfer.id },
        relations: { medicine: true },
      });

      if (dto.status === 'recibido') {
        await this.moveStock(em, transfer, items, user.id);
        transfer.receivedById = user.id;
      }
      transfer.status = dto.status;
      await em.save(transfer);

      return (await em.findOne(StockTransfer, {
        where: { id: transfer.id },
        relations: TRANSFER_RELATIONS,
      })) as StockTransfer;
    });
  }

  /**
   * Mueve stock al recibir: descuenta inventario y lotes en ORIGEN (FEFO)
   * y abona en DESTINO, todo en la misma transacción con bloqueos pesimistas.
   */
  private async moveStock(
    em: EntityManager,
    transfer: StockTransfer,
    items: TransferItem[],
    receiverId: number,
  ): Promise<void> {
    const sorted = [...items].sort((a, b) => a.medicineId - b.medicineId);

    for (const item of sorted) {
      const srcInv = await em.findOne(InventoryItem, {
        where: { medicineId: item.medicineId, branchId: transfer.fromBranchId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!srcInv || srcInv.quantityAvailable < item.quantity) {
        throw new ConflictException(
          `Stock insuficiente de "${item.medicine.name}" en la sucursal origen ` +
            `(disponible: ${srcInv ? srcInv.quantityAvailable : 0}, ` +
            `solicitado: ${item.quantity}). El traslado no se recibió.`,
        );
      }

      const batches = await em.find(Batch, {
        where: {
          medicineId: item.medicineId,
          branchId: transfer.fromBranchId,
          isActive: true,
        },
        order: { expirationDate: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      let remaining = item.quantity;
      for (const batch of batches) {
        if (remaining === 0) break;
        if (batch.quantityRemaining <= 0) continue;
        const take = Math.min(remaining, batch.quantityRemaining);
        batch.quantityRemaining -= take;
        remaining -= take;
        await em.save(batch);

        const dstBatch = await em.findOne(Batch, {
          where: { code: batch.code, branchId: transfer.toBranchId },
          lock: { mode: 'pessimistic_write' },
        });
        if (dstBatch) {
          dstBatch.quantityInitial += take;
          dstBatch.quantityRemaining += take;
          await em.save(dstBatch);
        } else {
          await em.save(
            em.create(Batch, {
              code: batch.code,
              expirationDate: batch.expirationDate,
              quantityInitial: take,
              quantityRemaining: take,
              unitCost: batch.unitCost,
              notes: `Traslado #${transfer.id}`,
              medicineId: batch.medicineId,
              supplierId: batch.supplierId,
              branchId: transfer.toBranchId,
              registeredById: receiverId,
            }),
          );
        }
      }
      if (remaining > 0) {
        throw new ConflictException(
          `Lotes insuficientes de "${item.medicine.name}" en la sucursal origen ` +
            `(faltan ${remaining} unidades). El traslado no se recibió.`,
        );
      }

      srcInv.quantityAvailable -= item.quantity;
      srcInv.lastMovementAt = new Date();
      await em.save(srcInv);

      let dstInv = await em.findOne(InventoryItem, {
        where: { medicineId: item.medicineId, branchId: transfer.toBranchId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!dstInv) {
        dstInv = em.create(InventoryItem, {
          medicineId: item.medicineId,
          branchId: transfer.toBranchId,
          quantityAvailable: 0,
          lastMovementAt: null,
        });
      }
      dstInv.quantityAvailable += item.quantity;
      dstInv.lastMovementAt = new Date();
      await em.save(dstInv);
    }
  }

  private assertScope(user: AuthUser, transfer: StockTransfer): void {
    if (user.role === Role.SUPER_ADMIN) return;
    if (
      user.role === Role.SUPERVISOR &&
      transfer.fromBranch?.cityId === user.cityId &&
      transfer.toBranch?.cityId === user.cityId
    ) {
      return;
    }
    throw new ForbiddenException('El traslado no pertenece a tu ciudad');
  }
}
