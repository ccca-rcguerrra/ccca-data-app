import { Territory } from '../../model/entities/territory.entity';
import { TerritoryDto } from '../../users/dto/territory.dto';

/** Columns that exist on public_app.territories (no generated category_name). */
export const TERRITORY_LIST_SELECT = [
  'territory.id',
  'territory.version',
  'territory.name',
  'territory.category',
  'territory.source',
  'territory.areaHa',
  'territory.enabled',
] as const;

export function formatTerritoryCategoryName(category?: string | null): string | null {
  if (!category) return null;
  return category
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function toTerritoryDto(territory: Territory): TerritoryDto {
  return {
    id: territory.id,
    version: territory.version,
    name: territory.name,
    category: territory.category,
    categoryName: formatTerritoryCategoryName(territory.category),
    source: territory.source,
    areaHa: territory.areaHa || null,
    enabled: territory.enabled ?? true,
  };
}
