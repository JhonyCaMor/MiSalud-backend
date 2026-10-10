import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SanitaryRecord } from './entities/sanitary-record.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import {
  CreateSanitaryRecordDto,
  UpdateSanitaryRecordDto,
} from './dto/sanitary-record.dto';

@Injectable()
export class InvimaSanitaryService {
  constructor(
    @InjectRepository(SanitaryRecord)
    private readonly recordsRepo: Repository<SanitaryRecord>,
    @InjectRepository(Medicine)
    private readonly medicinesRepo: Repository<Medicine>,
  ) {}

  async create(dto: CreateSanitaryRecordDto): Promise<SanitaryRecord> {
    await this.assertMedicine(dto.medicineId);
    if (
      await this.recordsRepo.findOne({ where: { invimaCode: dto.invimaCode } })
    ) {
      throw new ConflictException(
        `El registro INVIMA "${dto.invimaCode}" ya existe`,
      );
    }
    const record = this.recordsRepo.create({
      invimaCode: dto.invimaCode,
      resolutionNumber: dto.resolutionNumber,
      description: dto.description,
      category: dto.category,
      issuedAt: dto.issuedAt.slice(0, 10),
      expiresAt: dto.expiresAt ? dto.expiresAt.slice(0, 10) : null,
      medicineId: dto.medicineId ?? null,
    });
    return this.recordsRepo.save(record);
  }

  findAll(
    filters: { search?: string; active?: string } = {},
  ): Promise<SanitaryRecord[]> {
    const qb = this.recordsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.medicine', 'medicine')
      .orderBy('r.issuedAt', 'DESC');

    if (filters.search) {
      qb.andWhere('(r.invimaCode ILIKE :s OR r.description ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }
    if (filters.active !== undefined && filters.active !== '') {
      qb.andWhere('r.isActive = :active', {
        active: filters.active === 'true',
      });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<SanitaryRecord> {
    const record = await this.recordsRepo.findOne({
      where: { id },
      relations: { medicine: true },
    });
    if (!record)
      throw new NotFoundException(`El registro INVIMA con id ${id} no existe`);
    return record;
  }

  async update(
    id: number,
    dto: UpdateSanitaryRecordDto,
  ): Promise<SanitaryRecord> {
    const record = await this.findOne(id);
    await this.assertMedicine(dto.medicineId);
    if (dto.invimaCode && dto.invimaCode !== record.invimaCode) {
      const dup = await this.recordsRepo.findOne({
        where: { invimaCode: dto.invimaCode },
      });
      if (dup)
        throw new ConflictException(
          `El registro INVIMA "${dto.invimaCode}" ya existe`,
        );
    }
    record.invimaCode = dto.invimaCode ?? record.invimaCode;
    record.resolutionNumber = dto.resolutionNumber ?? record.resolutionNumber;
    record.description = dto.description ?? record.description;
    record.category = dto.category ?? record.category;
    record.issuedAt = (dto.issuedAt ?? record.issuedAt).slice(0, 10);
    if (dto.expiresAt !== undefined) {
      record.expiresAt = dto.expiresAt.slice(0, 10);
    }
    if (dto.medicineId !== undefined) record.medicineId = dto.medicineId;
    return this.recordsRepo.save(record);
  }

  async remove(id: number): Promise<SanitaryRecord> {
    const record = await this.findOne(id);
    record.isActive = false;
    return this.recordsRepo.save(record);
  }

  private async assertMedicine(medicineId?: number): Promise<void> {
    if (medicineId === undefined) return;
    const medicine = await this.medicinesRepo.findOne({
      where: { id: medicineId },
    });
    if (!medicine)
      throw new NotFoundException(
        `El medicamento con id ${medicineId} no existe`,
      );
  }
}
