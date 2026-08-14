import { useMemo } from 'react';
import { useAuthStore } from '@/stores';
import type { Permission } from '@/constants/permissions';

/**
 * usePermissions
 *
 * Lê as permissões do usuário logado (vindas do backend via login / GET /auth/me)
 * e expõe helpers para checagem no componente.
 *
 * O frontend não conhece papéis nem hierarquia — apenas consulta a lista de
 * permissões computadas pelo backend.
 *
 * @example
 * const { can } = usePermissions();
 * {can('audit.approve') && <ApproveButton />}
 *
 * @example
 * const { canAny } = usePermissions();
 * {canAny('refinements.approve', 'audit.approve') && <ActionPanel />}
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const permissionSet = useMemo(
    // Guards against persisted sessions whose `permissions` is not an array.
    () => new Set<string>(Array.isArray(user?.permissions) ? user.permissions : []),
    [user?.permissions],
  );

  return {
    /** Verifica se o usuário possui a permissão informada. */
    can: (permission: Permission): boolean => permissionSet.has(permission),

    /** Verifica se o usuário possui ao menos uma das permissões informadas. */
    canAny: (...permissions: Permission[]): boolean =>
      permissions.some((p) => permissionSet.has(p)),

    /** Verifica se o usuário possui todas as permissões informadas. */
    canAll: (...permissions: Permission[]): boolean =>
      permissions.every((p) => permissionSet.has(p)),

    /** Conjunto completo de permissões (para inspeção / debug). */
    permissions: permissionSet,
  };
}
