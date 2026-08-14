import { UserRole } from '../model/model.enums';

/**
 * Ações que podem ser controladas no sistema.
 * Cada valor é a string retornada na resposta de login e /me.
 */
export enum Permission {
  // Activations
  ACTIVATIONS_CREATE   = 'activations.create',

  // Refinamento
  REFINEMENTS_APPROVE  = 'refinements.approve',
  REFINEMENTS_REJECT   = 'refinements.reject',

  // Auditoria
  AUDIT_APPROVE        = 'audit.approve',
  AUDIT_REJECT         = 'audit.reject',

  // Alertas — mudança manual de status (ex.: cancelar/reabrir publicado)
  ALERTS_CHANGE_STATUS = 'alerts.change_status',

  // Alertas — mudança manual da classe de desmatamento
  ALERTS_CHANGE_CLASS  = 'alerts.change_class',

  // Módulo supports (integração externa)
  SUPPORTS_MANAGE      = 'supports.manage',

  // Usuários e times
  USERS_MANAGE         = 'users.manage',
  TEAMS_MANAGE         = 'teams.manage',

  // Working / reservas — agir sobre alertas reservados por outro analista
  WORKING_OVERRIDE     = 'working.override',

  // Administração
  ADMIN_ACCESS         = 'admin.access',
}

/**
 * Mapa explícito papel → permissões.
 * Cada papel lista todas as permissões que possui (incluindo as herdadas do nível abaixo),
 * de forma que o frontend não precisa conhecer a hierarquia.
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.COORDINATOR]: [
    Permission.ACTIVATIONS_CREATE,
    Permission.REFINEMENTS_APPROVE,
    Permission.REFINEMENTS_REJECT,
    Permission.AUDIT_APPROVE,
    Permission.AUDIT_REJECT,
    Permission.ALERTS_CHANGE_STATUS,
    Permission.ALERTS_CHANGE_CLASS,
    Permission.SUPPORTS_MANAGE,
    Permission.USERS_MANAGE,
    Permission.TEAMS_MANAGE,
    Permission.WORKING_OVERRIDE,
  ],

  [UserRole.ANALYST_SENIOR]: [
    Permission.ACTIVATIONS_CREATE,
    Permission.REFINEMENTS_APPROVE,
    Permission.REFINEMENTS_REJECT,
    Permission.AUDIT_APPROVE,
    Permission.AUDIT_REJECT,
  ],

  [UserRole.ANALYST_MIDLEVEL]: [
    Permission.ACTIVATIONS_CREATE,
    Permission.REFINEMENTS_APPROVE,
    Permission.REFINEMENTS_REJECT,
  ],

  [UserRole.ANALYST_JUNIOR]: [
    Permission.ACTIVATIONS_CREATE,
  ],

  [UserRole.ANALYST_SUPPORT]: [
    Permission.SUPPORTS_MANAGE,
  ],

  [UserRole.VIEWER]: [],
};

/**
 * Computa o conjunto de permissões de um usuário a partir de seus papéis.
 * Se o usuário tiver múltiplos papéis, as permissões são unidas.
 */
export function computePermissions(roles: UserRole[]): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      set.add(perm);
    }
  }
  return [...set];
}
