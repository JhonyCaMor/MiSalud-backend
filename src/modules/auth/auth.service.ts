import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/auth-user.interface';
import { User } from '../users/entities/user.entity';

// Hash ficticio para igualar el tiempo de respuesta cuando el usuario no existe
const DUMMY_HASH = bcrypt.hashSync('misalud-dummy-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const match = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_HASH,
    );
    if (!user || !user.isActive || !match) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      cityId: user.cityId,
      branchId: user.branchId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
      user: this.sanitize(user),
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findAuthUser(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitize(user, true);
  }

  private sanitize(user: User, withRelations = false) {
    const base = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      cityId: user.cityId,
      branchId: user.branchId,
      isActive: user.isActive,
    };
    if (!withRelations) return base;
    return {
      ...base,
      city: user.city ? { id: user.city.id, name: user.city.name } : null,
      branch: user.branch
        ? { id: user.branch.id, name: user.branch.name }
        : null,
    };
  }
}
