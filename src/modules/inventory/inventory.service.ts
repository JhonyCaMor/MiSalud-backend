import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
  ) {}

  async findAll(
    user: AuthUser,
    filters: { branchId?: number; search?: string } = {},
  ): Promise<InventoryItem[]> {
    const qb = this.inventoryRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.medicine', 'medicine')
      .leftJoinAndSelect('i.branch', 'branch')
      .orderBy('medicine.name', 'ASC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('i.branchId = :branchId', { branchId: user.branchId });
    }

    if (filters.branchId) {
      qb.andWhere('i.branchId = :fBranchId', { fBranchId: filters.branchId });
    }
    if (filters.search) {
      qb.andWhere(
        '(medicine.name ILIKE :s OR medicine.activeIngredient ILIKE :s OR medicine.code ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }
    qb.andWhere('i.quantityAvailable > 0');

    return qb.getMany();
  }
}
