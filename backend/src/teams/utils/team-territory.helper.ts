import { In, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { TeamTerritory } from '../../model/entities/team-territory.entity';

export const TEAM_TERRITORY_ALERT_JOIN =
  'teamterritory.territoryId = alertterritories.biome_id OR teamterritory.territoryId = alertterritories.state_id OR teamterritory.territoryId = alertterritories.city_id';

/**
 * Join condition that maps an alert to a team territory using the denormalized
 * `alert_metadata.alertTerritoryIds` array (same territory source used by
 * `alerts.service.findAll`). Matches ANY territory in the array — including
 * categories beyond biome/state/city (conservation units, indigenous lands…).
 * The `alert_metadata` entity must already be joined with alias `alertMeta`.
 */
export const TEAM_TERRITORY_METADATA_JOIN =
  'teamterritory.territoryId = ANY(alertMeta.alertTerritoryIds)';

/**
 * Applies a territory filter over the denormalized `alert_metadata.alertTerritoryIds`
 * array, matching ANY of the given territory IDs. This is the canonical territory
 * filter used by `alerts.service.findAll`; use it everywhere so listing and
 * statistics stay in parity. The `alert_metadata` entity must already be joined
 * with the given `metadataAlias`.
 *
 * @param paramName unique parameter name — also used to alias the unnest, so it
 *   must be distinct when applying more than one territory filter to the same query.
 */
export function applyAlertMetadataTerritoryFilter(
  queryBuilder: SelectQueryBuilder<ObjectLiteral>,
  metadataAlias: string,
  territoryIds: number[],
  paramName: string,
): void {
  if (!territoryIds || territoryIds.length === 0) {
    return;
  }

  queryBuilder.andWhere(
    `EXISTS (
      SELECT 1
      FROM unnest(${metadataAlias}.alertTerritoryIds) AS ${paramName}_tid(tid)
      WHERE ${paramName}_tid.tid = ANY(:${paramName})
    )`,
    { [paramName]: territoryIds },
  );
}

export async function resolveTerritoryIdsByTeamIds(
  teamTerritoryRepository: Repository<TeamTerritory>,
  teamIds: number[],
): Promise<number[]> {
  if (teamIds.length === 0) {
    return [];
  }

  const rows = await teamTerritoryRepository.find({
    where: { teamId: In(teamIds) },
    select: ['territoryId'],
  });

  return [...new Set(rows.map((row) => row.territoryId))];
}

export async function setTeamTerritory(
  teamTerritoryRepository: Repository<TeamTerritory>,
  teamId: number,
  territoryId: number | null | undefined,
): Promise<void> {
  await teamTerritoryRepository.delete({ teamId });

  if (territoryId != null) {
    await teamTerritoryRepository.save(
      teamTerritoryRepository.create({ teamId, territoryId }),
    );
  }
}

export function getPrimaryTeamTerritory(
  teamTerritories: TeamTerritory[] | undefined,
): TeamTerritory | undefined {
  return teamTerritories?.[0];
}

/**
 * Applies the explicit territory filter and the team territory filter as
 * independent AND conditions (intersection), instead of merging both ID sets
 * into a single OR condition. `alertterritories` must already be joined on the
 * query builder with `biome_id`, `state_id` and `city_id` columns.
 */
export function applyTerritoryAndTeamFilters(
  queryBuilder: SelectQueryBuilder<ObjectLiteral>,
  territoryIds: number[] | undefined,
  teamTerritoryIds: number[] | undefined,
): void {
  if (territoryIds && territoryIds.length > 0) {
    queryBuilder.andWhere(
      `(alertterritories.biome_id IN (:...territoryIds) OR
        alertterritories.state_id IN (:...territoryIds) OR
        alertterritories.city_id IN (:...territoryIds))`,
      { territoryIds },
    );
  }

  if (teamTerritoryIds && teamTerritoryIds.length > 0) {
    queryBuilder.andWhere(
      `(alertterritories.biome_id IN (:...teamTerritoryIds) OR
        alertterritories.state_id IN (:...teamTerritoryIds) OR
        alertterritories.city_id IN (:...teamTerritoryIds))`,
      { teamTerritoryIds },
    );
  }
}
