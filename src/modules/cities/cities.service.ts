import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly citiesRepo: Repository<City>,
  ) {}

  async findAll(user: AuthUser): Promise<City[]> {
    if (user.role === Role.SUPERVISOR) {
      return this.citiesRepo.find({
        where: { id: user.cityId as number },
        relations: { branches: true },
      });
    }
    return this.citiesRepo.find({
      relations: { branches: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<City> {
    const city = await this.citiesRepo.findOne({
      where: { id },
      relations: { branches: true },
    });
    if (!city) throw new NotFoundException(`Ciudad con id ${id} no encontrada`);
    return city;
  }

  async create(dto: CreateCityDto): Promise<City> {
    const existing = await this.citiesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing)
      throw new ConflictException(`La ciudad "${dto.name}" ya existe`);
    const city = this.citiesRepo.create({
      name: dto.name,
      department: dto.department ?? 'Valle del Cauca',
    });
    return this.citiesRepo.save(city);
  }

  async update(id: number, dto: UpdateCityDto): Promise<City> {
    const city = await this.findOne(id);
    Object.assign(city, dto);
    return this.citiesRepo.save(city);
  }

  async remove(id: number): Promise<City> {
    const city = await this.findOne(id);
    city.isActive = false;
    return this.citiesRepo.save(city);
  }
}
