import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  cityId?: number | null;
  branchId?: number | null;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  cityId?: number | null;
  branchId?: number | null;
}
