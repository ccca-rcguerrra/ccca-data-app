import type { Team } from '@/types/teams';
import { formatDistanceToNow } from 'date-fns';

/**
 * Team status for list UI (API does not provide yet)
 */
export type TeamStatusUI = 'active' | 'archived';

export interface TeamMemberPreview {
  id: number;
  name: string;
  photo: string | null;
}

/**
 * Team card data for teams management grid
 */
export interface TeamRowData {
  id: string;
  name: string;
  institution: string;
  biomes: string[];
  territoryLabel: string;
  memberPreviews: TeamMemberPreview[];
  usersCount: number;
  lastUpdated: string;
  status: TeamStatusUI;
}

/**
 * Convert API Team to card list format.
 * List endpoint often returns only `territoryId`; resolve name via territories catalog (same as edit modal).
 */
export function convertTeamToRowData(
  team: Team,
  territoryNamesById?: ReadonlyMap<number, string>,
  t?: (key: string) => string,
): TeamRowData {
  const fromRelation =
    team.territories?.map((t) => t.name).filter((n): n is string => Boolean(n)) ?? [];

  let biomes: string[];
  let territoryLabel: string;

  if (fromRelation.length > 0) {
    biomes = fromRelation;
    territoryLabel = fromRelation.join(' · ');
  } else if (team.territoryId != null) {
    const resolved = territoryNamesById?.get(team.territoryId);
    if (resolved) {
      biomes = [resolved];
      territoryLabel = resolved;
    } else {
      biomes = [];
      territoryLabel = t?.('teams.management.grid.noTerritory') ?? 'No territory assigned';
    }
  } else {
    biomes = [];
    territoryLabel = t?.('teams.management.grid.noTerritory') ?? 'No territory assigned';
  }
  const memberPreviews: TeamMemberPreview[] =
    team.users?.slice(0, 5).map((u) => ({
      id: u.id,
      name: u.name,
      photo: null,
    })) ?? [];

  return {
    id: String(team.id),
    name: team.name,
    institution: '', // API does not provide
    biomes,
    territoryLabel,
    memberPreviews,
    usersCount: team.usersCount ?? 0,
    lastUpdated: team.updatedAt,
    status: 'active',
  };
}

/**
 * Format relative time for display (e.g. "2 days ago")
 */
export function formatRelative(isoDate: string): string {
  return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
}

export const BIOME_OPTIONS = [
  'Amazon',
  'Cerrado',
  'Atlantic',
  'Caatinga',
  'Pantanal',
  'Pampa',
];

export const INSTITUTION_OPTIONS = [
  'CCCA',
  'Green Data Lab',
  'Amazonia Institute',
  'National Observatory',
  'Cerrado Coalition',
];
