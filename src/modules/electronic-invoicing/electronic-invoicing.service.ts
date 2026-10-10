import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { ElectronicInvoice } from './entities/electronic-invoice.entity';
import { Sale } from '../sales/entities/sale.entity';
import {
  CreateElectronicInvoiceDto,
  UpdateInvoiceStatusDto,
} from './dto/electronic-invoice.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class ElectronicInvoicingService {
  constructor(
    @InjectRepository(ElectronicInvoice)
    private readonly invoicesRepo: Repository<ElectronicInvoice>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
  ) {}

  async create(
    user: AuthUser,
    dto: CreateElectronicInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const sale = await this.salesRepo.findOne({
      where: { id: dto.saleId },
      relations: { branch: true },
    });
    if (!sale)
      throw new NotFoundException(`La venta con id ${dto.saleId} no existe`);
    if (user.role === Role.SUPERVISOR && sale.branch.cityId !== user.cityId) {
      throw new ForbiddenException('La venta pertenece a otra ciudad');
    }

    const existing = await this.invoicesRepo.findOne({
      where: { saleId: sale.id },
    });
    if (existing)
      throw new ConflictException(
        `La venta ${sale.id} ya tiene la factura ${existing.invoiceNumber}`,
      );

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoice = this.invoicesRepo.create({
      saleId: sale.id,
      invoiceNumber: `FV${today}-${sale.id}`,
      cufe: createHash('sha256')
        .update(`${sale.id}|${sale.total}|${randomUUID()}`)
        .digest('hex'),
      total: sale.total,
      status: 'enviada',
      dianResponse: null,
    });
    return this.invoicesRepo.save(invoice);
  }

  findAll(
    user: AuthUser,
    filters: { status?: string } = {},
  ): Promise<ElectronicInvoice[]> {
    const qb = this.invoicesRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.sale', 'sale')
      .leftJoinAndSelect('sale.branch', 'branch')
      .leftJoinAndSelect('sale.seller', 'seller')
      .orderBy('i.issuedAt', 'DESC');

    if (user.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :cityId', { cityId: user.cityId });
    } else if (user.role === Role.VENDEDOR) {
      qb.andWhere('sale.sellerId = :sellerId', { sellerId: user.id });
    }

    if (filters.status) {
      qb.andWhere('i.status = :status', { status: filters.status });
    }

    return qb.getMany();
  }

  async findOne(user: AuthUser, id: number): Promise<ElectronicInvoice> {
    const invoice = await this.invoicesRepo.findOne({
      where: { id },
      relations: { sale: { branch: true, seller: true } },
    });
    if (!invoice)
      throw new NotFoundException(`La factura con id ${id} no existe`);
    if (user.role === Role.VENDEDOR && invoice.sale.sellerId !== user.id) {
      throw new ForbiddenException('La factura pertenece a otra venta');
    }
    if (
      user.role === Role.SUPERVISOR &&
      invoice.sale.branch.cityId !== user.cityId
    ) {
      throw new ForbiddenException('La factura pertenece a otra ciudad');
    }
    return invoice;
  }

  async updateStatus(
    id: number,
    dto: UpdateInvoiceStatusDto,
  ): Promise<ElectronicInvoice> {
    const invoice = await this.invoicesRepo.findOne({ where: { id } });
    if (!invoice)
      throw new NotFoundException(`La factura con id ${id} no existe`);
    invoice.status = dto.status;
    invoice.dianResponse = dto.dianResponse ?? invoice.dianResponse;
    return this.invoicesRepo.save(invoice);
  }
}
