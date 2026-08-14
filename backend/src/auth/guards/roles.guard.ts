import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../model/model.enums';
import { UserRole as UserRoleEntity } from '../../model/entities/user-role.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Papéis que cada papel implica (hierarquia aditiva).
 * Um COORDINATOR pode fazer tudo que ANALYST_SENIOR, ANALYST_MIDLEVEL e ANALYST_JUNIOR fazem.
 * ANALYST_SUPPORT é lateral: não herda da cadeia vertical e não é herdado por ela.
 */
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: Object.values(UserRole),
  [UserRole.COORDINATOR]: [
    UserRole.COORDINATOR,
    UserRole.ANALYST_SENIOR,
    UserRole.ANALYST_MIDLEVEL,
    UserRole.ANALYST_JUNIOR,
    UserRole.VIEWER,
  ],
  [UserRole.ANALYST_SENIOR]: [
    UserRole.ANALYST_SENIOR,
    UserRole.ANALYST_MIDLEVEL,
    UserRole.ANALYST_JUNIOR,
    UserRole.VIEWER,
  ],
  [UserRole.ANALYST_MIDLEVEL]: [
    UserRole.ANALYST_MIDLEVEL,
    UserRole.ANALYST_JUNIOR,
    UserRole.VIEWER,
  ],
  [UserRole.ANALYST_JUNIOR]: [
    UserRole.ANALYST_JUNIOR,
    UserRole.VIEWER,
  ],
  [UserRole.ANALYST_SUPPORT]: [
    UserRole.ANALYST_SUPPORT,
    UserRole.VIEWER,
  ],
  [UserRole.VIEWER]: [UserRole.VIEWER],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const assignedRoles: UserRole[] = (user?.userRoles ?? []).map(
      (ur: UserRoleEntity) => ur.role,
    );

    const effectiveRoles = new Set<UserRole>();
    for (const assigned of assignedRoles) {
      for (const implied of ROLE_HIERARCHY[assigned] ?? [assigned]) {
        effectiveRoles.add(implied);
      }
    }

    return requiredRoles.some((role) => effectiveRoles.has(role));
  }
}
