import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Branch } from '../branches/entities/branch.entity';
import { City } from '../cities/entities/city.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchesRepo: Repository<Branch>,
    @InjectRepository(City)
    private readonly citiesRepo: Repository<City>,
  ) {}

  async findAll(actor: AuthUser, query: UsersQueryDto): Promise<User[]> {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.city', 'city')
      .leftJoinAndSelect('u.branch', 'branch')
      .orderBy('u.fullName', 'ASC');

    if (actor.role === Role.SUPERVISOR) {
      qb.andWhere('branch.cityId = :scopedCityId', {
        scopedCityId: actor.cityId,
      });
    }

    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }
    if (query.branchId) {
      qb.andWhere('u.branchId = :branchId', { branchId: query.branchId });
    }
    if (query.cityId && actor.role === Role.SUPER_ADMIN) {
      qb.andWhere('(u.cityId = :cityId OR branch.cityId = :cityId)', {
        cityId: query.cityId,
      });
    }
    if (query.search) {
      qb.andWhere('(u.fullName ILIKE :s OR u.email ILIKE :s)', {
        s: `%${query.search}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(actor: AuthUser, id: number): Promise<User> {
    const target = await this.usersRepo.findOne({
      where: { id },
      relations: { city: true, branch: true },
    });
    if (!target)
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    this.assertCanManage(actor, target);
    return target;
  }

  async create(actor: AuthUser, dto: CreateUserDto): Promise<User> {
    if (actor.role === Role.SUPERVISOR && dto.role !== Role.VENDEDOR) {
      throw new ForbiddenException(
        'Un supervisor solo puede crear usuarios con rol vendedor',
      );
    }

    const existing = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException(`El email ${dto.email} ya está registrado`);

    const assignment = await this.resolveAssignment(actor, dto);

    const user = this.usersRepo.create({
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      password: await bcrypt.hash(dto.password, SALT_ROUNDS),
      cityId: assignment.cityId,
      branchId: assignment.branchId,
    });

    const saved = await this.usersRepo.save(user);
    return this.sanitize(await this.reloadWithRelations(saved.id));
  }

  async update(actor: AuthUser, id: number, dto: UpdateUserDto): Promise<User> {
    await this.findOne(actor, id);
    const target = await this.usersRepo.findOne({ where: { id } });
    if (!target)
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);

    if (dto.email && dto.email !== target.email) {
      const duplicate = await this.usersRepo.findOne({
        where: { email: dto.email },
      });
      if (duplicate)
        throw new ConflictException(`El email ${dto.email} ya está registrado`);
      target.email = dto.email;
    }

    const newRole = dto.role ?? target.role;

    if (actor.role === Role.SUPERVISOR) {
      if (target.role !== Role.VENDEDOR) {
        throw new ForbiddenException(
          'Un supervisor solo puede modificar vendedores',
        );
      }
      if (newRole !== Role.VENDEDOR) {
        throw new ForbiddenException(
          'Un supervisor no puede cambiar el rol de un usuario',
        );
      }
    }

    if (dto.role && dto.role !== target.role) {
      const assignment = await this.resolveAssignment(actor, {
        ...dto,
        role: dto.role,
      });
      target.cityId = assignment.cityId;
      target.branchId = assignment.branchId;
      target.role = dto.role;
    } else {
      if (
        dto.branchId !== undefined &&
        dto.branchId !== null &&
        dto.branchId !== target.branchId
      ) {
        if (target.role === Role.SUPERVISOR) {
          throw new BadRequestException(
            'Un supervisor no tiene sucursal asignada',
          );
        }
        if (target.role === Role.SUPER_ADMIN) {
          throw new BadRequestException(
            'Un super_admin no tiene sucursal asignada',
          );
        }
        if (
          actor.role !== Role.SUPER_ADMIN &&
          !(actor.role === Role.SUPERVISOR && target.role === Role.VENDEDOR)
        ) {
          throw new ForbiddenException('No puedes reasignar sucursales');
        }
        const branch = await this.branchesRepo.findOne({
          where: { id: dto.branchId },
        });
        if (!branch)
          throw new NotFoundException(
            `La sucursal con id ${dto.branchId} no existe`,
          );
        if (actor.role === Role.SUPERVISOR && branch.cityId !== actor.cityId) {
          throw new ForbiddenException(
            'La sucursal debe pertenecer a tu ciudad',
          );
        }
        target.branchId = branch.id;
        if (target.role === Role.VENDEDOR) {
          target.cityId = branch.cityId;
        }
      }

      if (
        dto.cityId !== undefined &&
        dto.cityId !== null &&
        dto.cityId !== target.cityId
      ) {
        if (target.role === Role.VENDEDOR) {
          const branch = target.branchId
            ? await this.branchesRepo.findOne({
                where: { id: target.branchId },
              })
            : null;
          if (!branch) {
            throw new BadRequestException(
              'El vendedor debe tener una sucursal asignada',
            );
          }
          if (dto.cityId !== branch.cityId) {
            throw new BadRequestException(
              'La ciudad no coincide con la sucursal del vendedor',
            );
          }
          target.cityId = branch.cityId;
        } else {
          if (target.role === Role.SUPER_ADMIN) {
            throw new BadRequestException(
              'Un super_admin no tiene ciudad asignada',
            );
          }
          if (actor.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException(
              'Solo un super_admin puede cambiar la ciudad de un usuario',
            );
          }
          const city = await this.citiesRepo.findOne({
            where: { id: dto.cityId },
          });
          if (!city)
            throw new NotFoundException(
              `La ciudad con id ${dto.cityId} no existe`,
            );
          if (!city.isActive)
            throw new ForbiddenException(
              `La ciudad "${city.name}" está inactiva`,
            );
          target.cityId = city.id;
          if (target.role === Role.SUPERVISOR) {
            target.branchId = null;
          }
        }
      }
    }

    if (dto.fullName !== undefined) target.fullName = dto.fullName;
    if (dto.isActive !== undefined) {
      if (dto.isActive === false && target.id === actor.id) {
        throw new BadRequestException('No puedes desactivar tu propio usuario');
      }
      target.isActive = dto.isActive;
    }

    const saved = await this.usersRepo.save(target);
    return this.sanitize(await this.reloadWithRelations(saved.id));
  }

  async remove(actor: AuthUser, id: number): Promise<User> {
    const target = await this.findOne(actor, id);
    if (target.id === actor.id) {
      throw new BadRequestException('No puedes eliminar tu propio usuario');
    }
    target.isActive = false;
    const saved = await this.usersRepo.save(target);
    return this.sanitize(saved);
  }

  async resetPassword(
    actor: AuthUser,
    id: number,
    newPassword: string,
  ): Promise<User> {
    const target = await this.findOne(actor, id);
    target.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const saved = await this.usersRepo.save(target);
    return this.sanitize(saved);
  }

  async changeOwnPassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.isActive) throw new ForbiddenException('Usuario inactivo');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      throw new BadRequestException('La contraseña actual es incorrecta');

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  async findAuthUser(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  private async resolveAssignment(
    actor: AuthUser,
    dto: { role: Role; cityId?: number; branchId?: number },
  ): Promise<{ cityId: number | null; branchId: number | null }> {
    switch (dto.role) {
      case Role.SUPER_ADMIN:
        return { cityId: null, branchId: null };

      case Role.SUPERVISOR: {
        if (!dto.cityId) {
          throw new BadRequestException(
            'cityId es obligatorio para supervisores',
          );
        }
        const city = await this.citiesRepo.findOne({
          where: { id: dto.cityId },
        });
        if (!city)
          throw new NotFoundException(
            `La ciudad con id ${dto.cityId} no existe`,
          );
        if (!city.isActive)
          throw new ForbiddenException(
            `La ciudad "${city.name}" está inactiva`,
          );
        return { cityId: city.id, branchId: null };
      }

      case Role.VENDEDOR: {
        if (!dto.branchId) {
          throw new BadRequestException(
            'branchId es obligatorio para vendedores',
          );
        }
        const branch = await this.branchesRepo.findOne({
          where: { id: dto.branchId },
        });
        if (!branch)
          throw new NotFoundException(
            `La sucursal con id ${dto.branchId} no existe`,
          );
        if (!branch.isActive) {
          throw new ForbiddenException(
            `La sucursal "${branch.name}" está inactiva`,
          );
        }
        if (actor.role === Role.SUPERVISOR && branch.cityId !== actor.cityId) {
          throw new ForbiddenException(
            'La sucursal debe pertenecer a tu ciudad',
          );
        }
        return { cityId: branch.cityId, branchId: branch.id };
      }

      default:
        throw new BadRequestException('Rol no válido');
    }
  }

  private async reloadWithRelations(id: number): Promise<User> {
    const fresh = await this.usersRepo.findOne({
      where: { id },
      relations: { city: true, branch: true },
    });
    if (!fresh)
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    return fresh;
  }

  private sanitize(user: User): User {
    const copy = { ...user } as Partial<User>;
    delete copy.password;
    return copy as User;
  }

  private assertCanManage(actor: AuthUser, target: User): void {
    switch (actor.role) {
      case Role.SUPER_ADMIN:
        return;

      case Role.SUPERVISOR: {
        const isSelf = actor.id === target.id;
        const isOwnVendedor =
          target.role === Role.VENDEDOR &&
          target.branch?.cityId === actor.cityId;
        if (isSelf || isOwnVendedor) return;
        throw new ForbiddenException(
          'Un supervisor solo puede gestionar usuarios de sus sucursales',
        );
      }

      case Role.VENDEDOR: {
        if (actor.id === target.id) return;
        throw new ForbiddenException(
          'Un vendedor solo puede acceder a su propio usuario',
        );
      }

      default:
        throw new ForbiddenException('Rol no reconocido');
    }
  }
}
