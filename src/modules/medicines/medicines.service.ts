import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from './entities/medicine.entity';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

@Injectable()
export class MedicinesService {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicinesRepo: Repository<Medicine>,
  ) {}

  async findAll(search?: string, category?: string): Promise<Medicine[]> {
    const qb = this.medicinesRepo
      .createQueryBuilder('m')
      .orderBy('m.name', 'ASC');
    if (search) {
      qb.andWhere(
        '(m.name ILIKE :s OR m.activeIngredient ILIKE :s OR m.code ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (category) {
      qb.andWhere('m.category ILIKE :category', { category: `%${category}%` });
    }
    return qb.getMany();
  }

  async findOne(id: number): Promise<Medicine> {
    const medicine = await this.medicinesRepo.findOne({ where: { id } });
    if (!medicine)
      throw new NotFoundException(`Medicamento con id ${id} no encontrado`);
    return medicine;
  }

  async create(dto: CreateMedicineDto): Promise<Medicine> {
    const invima = await this.medicinesRepo.findOne({
      where: { invimaNumber: dto.invimaNumber },
    });
    if (invima) {
      throw new ConflictException(
        `El registro INVIMA ${dto.invimaNumber} ya está asignado a "${invima.name}"`,
      );
    }

    let code = dto.code;
    if (code) {
      const dup = await this.medicinesRepo.findOne({ where: { code } });
      if (dup) throw new ConflictException(`El código ${code} ya existe`);
    } else {
      code = await this.generateCode();
    }

    const medicine = this.medicinesRepo.create({
      code,
      name: dto.name,
      activeIngredient: dto.activeIngredient,
      concentration: dto.concentration,
      presentation: dto.presentation,
      category: dto.category ?? 'General',
      invimaNumber: dto.invimaNumber,
      requiresPrescription: dto.requiresPrescription ?? false,
    });
    return this.medicinesRepo.save(medicine);
  }

  async update(id: number, dto: UpdateMedicineDto): Promise<Medicine> {
    const medicine = await this.findOne(id);

    if (dto.invimaNumber && dto.invimaNumber !== medicine.invimaNumber) {
      const dup = await this.medicinesRepo.findOne({
        where: { invimaNumber: dto.invimaNumber },
      });
      if (dup)
        throw new ConflictException(
          `El registro INVIMA ${dto.invimaNumber} ya existe`,
        );
      medicine.invimaNumber = dto.invimaNumber;
    }
    if (dto.code && dto.code !== medicine.code) {
      const dup = await this.medicinesRepo.findOne({
        where: { code: dto.code },
      });
      if (dup) throw new ConflictException(`El código ${dto.code} ya existe`);
      medicine.code = dto.code;
    }

    if (dto.name !== undefined) medicine.name = dto.name;
    if (dto.activeIngredient !== undefined)
      medicine.activeIngredient = dto.activeIngredient;
    if (dto.concentration !== undefined)
      medicine.concentration = dto.concentration;
    if (dto.presentation !== undefined)
      medicine.presentation = dto.presentation;
    if (dto.category !== undefined) medicine.category = dto.category;
    if (dto.requiresPrescription !== undefined) {
      medicine.requiresPrescription = dto.requiresPrescription;
    }

    return this.medicinesRepo.save(medicine);
  }

  async remove(id: number): Promise<Medicine> {
    const medicine = await this.findOne(id);
    medicine.isActive = false;
    return this.medicinesRepo.save(medicine);
  }

  private async generateCode(): Promise<string> {
    const last = await this.medicinesRepo
      .createQueryBuilder('m')
      .where("m.code LIKE 'MED-%'")
      .orderBy('m.code', 'DESC')
      .getOne();
    const next = last ? parseInt(last.code.replace('MED-', ''), 10) + 1 : 1;
    return `MED-${String(next).padStart(4, '0')}`;
  }
}
