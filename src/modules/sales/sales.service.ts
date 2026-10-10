import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Batch } from '../batches/entities/batch.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registra una venta del vendedor en SU sucursal.
   * - Bloquea el registro de inventario (pessimistic_write) para que dos
   *   vendedores no puedan vender el mismo stock simultáneamente.
   * - Asigna lotes por FEFO (primero vence, primero sale) con trazabilidad INVIMA.
   * - Todo ocurre en una transacción: si algo falla, no se registra nada.
   */
  async create(user: AuthUser, dto: CreateSaleDto): Promise<Sale> {
    if (user.role !== Role.VENDEDOR || !user.branchId) {
      throw new ForbiddenException(
        'Solo los vendedores pueden registrar ventas',
      );
    }
    const branchId = user.branchId;

    // Orden fijo por medicamento para evitar interbloqueos entre transacciones
    const items = [...dto.items].sort((a, b) => a.medicineId - b.medicineId);

    return this.dataSource.transaction(async (em) => {
      const sale = em.create(Sale, {
        branchId,
        sellerId: user.id,
        customerName: dto.customerName ?? null,
        total: 0,
        status: 'completada',
      });
      await em.save(sale);

      let total = 0;
      const saleItems: SaleItem[] = [];

      for (const item of items) {
        const medicine = await em.findOne(Medicine, {
          where: { id: item.medicineId },
        });
        if (!medicine || !medicine.isActive) {
          throw new NotFoundException(
            `El medicamento con id ${item.medicineId} no existe o está inactivo`,
          );
        }

        // Bloqueo del inventario pivote de esta sucursal
        const inventory = await em.findOne(InventoryItem, {
          where: { medicineId: item.medicineId, branchId },
          lock: { mode: 'pessimistic_write' },
        });
        const available = inventory ? inventory.quantityAvailable : 0;
        if (!inventory || available < item.quantity) {
          throw new ConflictException(
            `Stock insuficiente de "${medicine.name}" en esta sucursal ` +
              `(disponible: ${available}, solicitado: ${item.quantity}). La venta no se registró.`,
          );
        }

        // Selección de lotes FEFO (primero vence, primero sale)
        const batches = await em.find(Batch, {
          where: { medicineId: item.medicineId, branchId, isActive: true },
          order: { expirationDate: 'ASC' },
          lock: { mode: 'pessimistic_write' },
        });

        let remaining = item.quantity;
        const touchedBatches: Batch[] = [];
        for (const batch of batches) {
          if (remaining === 0) break;
          if (batch.quantityRemaining <= 0) continue;
          const take = Math.min(remaining, batch.quantityRemaining);
          batch.quantityRemaining -= take;
          remaining -= take;
          touchedBatches.push(batch);
          saleItems.push(
            em.create(SaleItem, {
              saleId: sale.id,
              medicineId: medicine.id,
              batchId: batch.id,
              quantity: take,
              unitPrice: item.unitPrice,
              subtotal: Number((take * item.unitPrice).toFixed(2)),
            }),
          );
        }
        if (remaining > 0) {
          throw new ConflictException(
            `Lotes insuficientes para "${medicine.name}" ` +
              `(faltan ${remaining} unidades). La venta no se registró.`,
          );
        }

        inventory.quantityAvailable -= item.quantity;
        inventory.lastMovementAt = new Date();

        await em.save(inventory);
        if (touchedBatches.length > 0) await em.save(touchedBatches);

        total += item.quantity * item.unitPrice;
      }

      sale.total = Number(total.toFixed(2));
      await em.save(saleItems);
      await em.save(sale);

      return (await em.findOne(Sale, {
        where: { id: sale.id },
        relations: {
          seller: true,
          branch: true,
          items: { medicine: true, batch: true },
        },
      })) as Sale;
    });
  }

  async findAll(
    user: AuthUser,
    filters: { branchId?: number; from?: string; to?: string } = {},
  ): Promise<Sale[]> {
    const qb = this.salesRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.seller', 'seller')
      .leftJoinAndSelect('s.branch', 'branch')
      .leftJoinAndSelect('s.items', 'item')
      .leftJoinAndSelect('item.medicine', 'medicine')
      .leftJoinAndSelect('item.batch', 'batch')
      .orderBy('s.createdAt', 'DESC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('s.sellerId = :sellerId', { sellerId: user.id });
    }

    if (filters.branchId) {
      qb.andWhere('s.branchId = :branchId', { branchId: filters.branchId });
    }
    if (filters.from) {
      qb.andWhere('s.createdAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('s.createdAt <= :to', { to: filters.to });
    }

    return qb.getMany();
  }

  async findOne(user: AuthUser, id: number): Promise<Sale> {
    const sale = await this.salesRepo.findOne({
      where: { id },
      relations: {
        seller: true,
        branch: true,
        items: { medicine: true, batch: true },
      },
    });
    if (!sale) throw new NotFoundException(`Venta con id ${id} no encontrada`);

    if (user.role === Role.VENDEDOR && sale.sellerId !== user.id) {
      throw new ForbiddenException(
        'Un vendedor solo puede ver sus propias ventas',
      );
    }
    if (user.role === Role.SUPERVISOR && sale.branch.cityId !== user.cityId) {
      throw new ForbiddenException('La venta pertenece a otra ciudad');
    }
    return sale;
  }
}
