import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { AuthUser } from '../interfaces/auth-user.interface';

/**
 * Reglas de alcance de datos por perfil:
 * - super_admin  -> todo el sistema (todas las ciudades y sucursales)
 * - supervisor   -> solo sucursales de SU ciudad asignada
 * - vendedor     -> solo SU sucursal asignada
 */
export function canAccessCity(
  user: AuthUser,
  cityId: number | null | undefined,
): boolean {
  switch (user.role) {
    case Role.SUPER_ADMIN:
      return true;
    case Role.SUPERVISOR:
      return cityId != null && cityId === user.cityId;
    case Role.VENDEDOR:
      return false;
    default:
      return false;
  }
}

export function canAccessBranch(
  user: AuthUser,
  target: {
    branchId: number | null | undefined;
    cityId: number | null | undefined;
  },
): boolean {
  switch (user.role) {
    case Role.SUPER_ADMIN:
      return true;
    case Role.SUPERVISOR:
      return target.cityId != null && target.cityId === user.cityId;
    case Role.VENDEDOR:
      return target.branchId != null && target.branchId === user.branchId;
    default:
      return false;
  }
}

export function assertCityAccess(
  user: AuthUser,
  cityId: number | null | undefined,
): void {
  if (!canAccessCity(user, cityId)) {
    throw new ForbiddenException('No tienes acceso a la ciudad solicitada');
  }
}

export function assertBranchAccess(
  user: AuthUser,
  target: {
    branchId: number | null | undefined;
    cityId: number | null | undefined;
  },
): void {
  if (!canAccessBranch(user, target)) {
    throw new ForbiddenException('No tienes acceso a la sucursal solicitada');
  }
}
