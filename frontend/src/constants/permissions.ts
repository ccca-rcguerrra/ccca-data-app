/**
 * Permissões do sistema — espelha o enum Permission do backend (auth.permissions.ts).
 * O frontend não conhece papéis nem hierarquia: apenas consulta esta lista.
 */
export const PERMISSIONS = {
  // Activations
  ACTIVATIONS_CREATE:  'activations.create',

  // Refinamento
  REFINEMENTS_APPROVE: 'refinements.approve',
  REFINEMENTS_REJECT:  'refinements.reject',

  // Auditoria
  AUDIT_APPROVE:       'audit.approve',
  AUDIT_REJECT:        'audit.reject',

  // Alertas — mudança manual de status (ex.: cancelar/reabrir publicado)
  ALERTS_CHANGE_STATUS: 'alerts.change_status',

  // Alertas — mudança manual da classe de desmatamento
  ALERTS_CHANGE_CLASS: 'alerts.change_class',

  // Módulo supports (integração externa)
  SUPPORTS_MANAGE:     'supports.manage',

  // Usuários e times
  USERS_MANAGE:        'users.manage',
  TEAMS_MANAGE:        'teams.manage',

  // Working / reservas — agir sobre alertas reservados por outro analista
  WORKING_OVERRIDE:    'working.override',

  // Administração
  ADMIN_ACCESS:        'admin.access',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
