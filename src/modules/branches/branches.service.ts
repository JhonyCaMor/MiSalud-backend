import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../common/enums/role.enum';
import { assertBranchAccess } from '../../common/utils/scope.util';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchesRepo: Repository<Branch>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(City)
    private readonly citiesRepo: Repository<City>,
  ) {}

  async findAll(user: AuthUser): Promise<Branch[]> {
    switch (user.role) {
      case Role.SUPER_ADMIN:
        return this.branchesRepo.find({
          relations: { city: true },
          order: { id: 'ASC' },
        });
      case Role.SUPERVISOR:
        return this.branchesRepo.find({
          where: { cityId: user.cityId as number },
          relations: { city: true },
          order: { id: 'ASC' },
        });
      case Role.VENDEDOR:
        return this.branchesRepo.find({
          where: { id: user.branchId as number },
          relations: { city: true },
        });
      default:
        throw new ForbiddenException('Rol no reconocido');
    }
  }

  async findOne(user: AuthUser, id: number): Promise<Branch> {
    const branch = await this.branchesRepo.findOne({
      where: { id },
      relations: { city: true },
    });
    if (!branch)
      throw new NotFoundException(`Sucursal con id ${id} no encontrada`);
    assertBranchAccess(user, { branchId: branch.id, cityId: branch.cityId });
    return branch;
  }

  async create(dto: CreateBranchDto): Promise<Branch> {
    const city = await this.citiesRepo.findOne({ where: { id: dto.cityId } });
    if (!city)
      throw new NotFoundException(`La ciudad con id ${dto.cityId} no existe`);
    if (!city.isActive)
      throw new ForbiddenException(`La ciudad "${city.name}" está inactiva`);

    const existing = await this.branchesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing)
      throw new ForbiddenException(`La sucursal "${dto.name}" ya existe`);

    const branch = this.branchesRepo.create({
      name: dto.name,
      address: dto.address ?? null,
      cityId: city.id,
    });
    return this.branchesRepo.save(branch);
  }

  async update(id: number, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.branchesRepo.findOne({ where: { id } });
    if (!branch)
      throw new NotFoundException(`Sucursal con id ${id} no encontrada`);

    if (dto.cityId !== undefined && dto.cityId !== branch.cityId) {
      const city = await this.citiesRepo.findOne({ where: { id: dto.cityId } });
      if (!city)
        throw new NotFoundException(`La ciudad con id ${dto.cityId} no existe`);
      branch.cityId = city.id;
    }
    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.address !== undefined) branch.address = dto.address;
    return this.branchesRepo.save(branch);
  }

  async remove(id: number): Promise<Branch> {
    const branch = await this.branchesRepo.findOne({ where: { id } });
    if (!branch)
      throw new NotFoundException(`Sucursal con id ${id} no encontrada`);
    branch.isActive = false;
    return this.branchesRepo.save(branch);
  }

  async findVendedores(user: AuthUser, branchId: number): Promise<User[]> {
    const branch = await this.findOne(user, branchId);
    return this.usersRepo.find({
      where: { branchId: branch.id, role: Role.VENDEDOR },
      order: { fullName: 'ASC' },
    });
  }
}
