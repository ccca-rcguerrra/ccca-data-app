import { PersonParticipationResponseDto } from './dto/person-participation-response.dto';

export const PERSON_PARTICIPATION_ROLES = [
  'PROPRIETARIO',
  'RESPONSAVEL_TECNICO',
  'ANALISTA',
  'ORIGEM_GF',
  'DESTINO_GF',
] as const;

export function emptyPersonParticipation(): PersonParticipationResponseDto {
  return {
    ownerAutefCount: 0,
    technicalResponsibleAutefCount: 0,
    analystAutefCount: 0,
    originGfCount: 0,
    destinationGfCount: 0,
    distinctAutefCount: 0,
    distinctGfCount: 0,
  };
}

export function parseCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapPersonParticipation(
  roleRows: Array<{ role?: unknown; count?: unknown }>,
  typeRows: Array<{ entity_type?: unknown; entityType?: unknown; count?: unknown }>,
): PersonParticipationResponseDto {
  const result = emptyPersonParticipation();
  const byRole = new Map<string, number>();
  for (const row of roleRows) {
    const role = typeof row.role === 'string' ? row.role : '';
    byRole.set(role, parseCount(row.count));
  }
  result.ownerAutefCount = byRole.get('PROPRIETARIO') ?? 0;
  result.technicalResponsibleAutefCount = byRole.get('RESPONSAVEL_TECNICO') ?? 0;
  result.analystAutefCount = byRole.get('ANALISTA') ?? 0;
  result.originGfCount = byRole.get('ORIGEM_GF') ?? 0;
  result.destinationGfCount = byRole.get('DESTINO_GF') ?? 0;

  for (const row of typeRows) {
    const entityType = String(row.entity_type ?? row.entityType ?? '');
    const count = parseCount(row.count);
    if (entityType === 'AUTEF') result.distinctAutefCount = count;
    if (entityType === 'GF') result.distinctGfCount = count;
  }
  return result;
}
