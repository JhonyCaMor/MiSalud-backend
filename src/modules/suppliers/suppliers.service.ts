import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
  ) {}

  findAll(): Promise<Supplier[]> {
    return this.suppliersRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.suppliersRepo.findOne({ where: { id } });
    if (!supplier)
      throw new NotFoundException(`Proveedor con id ${id} no encontrado`);
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const nit = await this.suppliersRepo.findOne({ where: { nit: dto.nit } });
    if (nit)
      throw new ConflictException(`El NIT ${dto.nit} ya está registrado`);

    const name = await this.suppliersRepo.findOne({
      where: { name: dto.name },
    });
    if (name)
      throw new ConflictException(`El proveedor "${dto.name}" ya existe`);

    const supplier = this.suppliersRepo.create({
      nit: dto.nit,
      name: dto.name,
      address: dto.address ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
    });
    return this.suppliersRepo.save(supplier);
  }

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (dto.nit && dto.nit !== supplier.nit) {
      const dup = await this.suppliersRepo.findOne({ where: { nit: dto.nit } });
      if (dup)
        throw new ConflictException(`El NIT ${dto.nit} ya está registrado`);
      supplier.nit = dto.nit;
    }
    if (dto.name && dto.name !== supplier.name) {
      const dup = await this.suppliersRepo.findOne({
        where: { name: dto.name },
      });
      if (dup)
        throw new ConflictException(`El proveedor "${dto.name}" ya existe`);
      supplier.name = dto.name;
    }
    if (dto.address !== undefined) supplier.address = dto.address ?? null;
    if (dto.phone !== undefined) supplier.phone = dto.phone ?? null;
    if (dto.email !== undefined) supplier.email = dto.email ?? null;

    return this.suppliersRepo.save(supplier);
  }

  async remove(id: number): Promise<Supplier> {
    const supplier = await this.findOne(id);
    supplier.isActive = false;
    return this.suppliersRepo.save(supplier);
  }
}
