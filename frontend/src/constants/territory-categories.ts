export interface TerritoryCategoryDef {
  value: string;
  label: string;
}

/**
 * Territory categories — UNIVERSE across all initiatives (BR/BOL/COL/IDN/PER),
 * the single source of truth in code. Mirrors each database's
 * `public.territory_category` enum.
 *
 * Each instance only USES a subset; which categories are displayed for an alert
 * is driven by AppConfig `territories.alertTerritoryMainCategories`. ALL distinct
 * values are kept to never rename a persisted value. The comment after each entry
 * lists which initiatives use it.
 */
export const TERRITORY_CATEGORIES: TerritoryCategoryDef[] = [
  // Shared administrative / cross-initiative
  { value: 'country', label: 'Country' }, //                                         BOL, COL, PER
  { value: 'department', label: 'Department' }, //                                    BOL, COL, PER
  { value: 'municipality', label: 'Municipality' }, //                               BOL, COL
  { value: 'region', label: 'Region' }, //                                           BOL, COL
  { value: 'province', label: 'Province' }, //                                        IDN, PER
  { value: 'district', label: 'District' }, //                                        IDN, PER
  { value: 'indigenous_reserve', label: 'Indigenous Reserve' }, //                    COL, PER
  { value: 'watershed_level_1', label: 'Watershed Level 1' }, //                       COL, PER
  { value: 'watershed_level_2', label: 'Watershed Level 2' }, //                       COL, PER
  { value: 'watershed_level_3', label: 'Watershed Level 3' }, //                       COL, PER

  // BR
  { value: 'refined_biome', label: 'Biome' }, //                                       BR
  { value: 'biome_legacy_do_not_use', label: 'Biome (legacy — do not use)' }, //       BR
  { value: 'state', label: 'State' }, //                                               BR
  { value: 'city', label: 'City' }, //                                                 BR
  { value: 'indigenous_land', label: 'Indigenous Land' }, //                           BR
  { value: 'settlement', label: 'Settlement' }, //                                     BR
  { value: 'level_1_basin', label: 'Level 1 Basin' }, //                               BR
  { value: 'level_2_basin', label: 'Level 2 Basin' }, //                               BR
  { value: 'quilombo', label: 'Quilombo' }, //                                         BR
  { value: 'conservation_unit', label: 'Conservation Unit' }, //                       BR
  { value: 'special_territory', label: 'Special Territory' }, //                       BR
  { value: 'biosphere_reserve', label: 'Biosphere Reserve' }, //                       BR
  { value: 'federal_protected_area_integral_protection', label: 'Federal Protected Area (Integral Protection)' }, //   BR
  { value: 'federal_protected_area_sustainable_use', label: 'Federal Protected Area (Sustainable Use)' }, //           BR
  { value: 'geopark', label: 'Geopark' }, //                                           BR
  { value: 'municipality_protected_area_integral_protection', label: 'Municipal Protected Area (Integral Protection)' }, // BR
  { value: 'municipality_protected_area_sustainable_use', label: 'Municipal Protected Area (Sustainable Use)' }, //    BR
  { value: 'pnrh_level_1_basin', label: 'PNRH Level 1 Basin' }, //                     BR
  { value: 'pnrh_level_2_basin', label: 'PNRH Level 2 Basin' }, //                     BR
  { value: 'state_protected_area_integral_protection', label: 'State Protected Area (Integral Protection)' }, //       BR
  { value: 'state_protected_area_sustainable_use', label: 'State Protected Area (Sustainable Use)' }, //               BR
  { value: 'archaeological_sites', label: 'Archaeological Sites' }, //                 BR
  { value: 'vegetation_map', label: 'Vegetation Map' }, //                             BR
  { value: 'priority_conservation_areas', label: 'Priority Conservation Areas' }, //   BR
  { value: 'forest_concessions', label: 'Forest Concessions' }, //                     BR
  { value: 'coastal_and_marine_system', label: 'Coastal and Marine System' }, //       BR
  { value: 'public_forest', label: 'Public Forest' }, //                               BR
  { value: 'bolsa_verde_program', label: 'Bolsa Verde Program' }, //                   BR

  // PER
  { value: 'amazonia_region', label: 'Amazonia Region' }, //                           PER
  { value: 'native_titled_community', label: 'Native Titled Community' }, //           PER
  { value: 'title_or_expansion_request', label: 'Title or Expansion Request' }, //     PER
  { value: 'territorial_reserve', label: 'Territorial Reserve' }, //                   PER
  { value: 'titled_peasant_community', label: 'Titled Peasant Community' }, //         PER
  { value: 'recognized_peasant_community', label: 'Recognized Peasant Community' }, // PER
  { value: 'natural_protected_area', label: 'Natural Protected Area' }, //             PER
  { value: 'buffer_zone', label: 'Buffer Zone' }, //                                   PER
  { value: 'regional_conservation_area', label: 'Regional Conservation Area' }, //     PER
  { value: 'private_conservation_area', label: 'Private Conservation Area' }, //       PER
  { value: 'ecozone', label: 'Ecozone' }, //                                           PER
  { value: 'geographic_region', label: 'Geographic Region' }, //                       PER
  { value: 'ecosystem', label: 'Ecosystem' }, //                                       PER
  { value: 'mining_cadastre', label: 'Mining Cadastre' }, //                           PER
  { value: 'watershed_level_4', label: 'Watershed Level 4' }, //                       PER

  // COL
  { value: 'biome', label: 'Biome' }, //                                               COL
  { value: 'raisg_limit', label: 'RAISG Limit' }, //                                   COL
  { value: 'peasant_reserve_zone', label: 'Peasant Reserve Zone' }, //                 COL
  { value: 'forest_reserve', label: 'Forest Reserve' }, //                             COL
  { value: 'ramsar_sites', label: 'Ramsar Sites' }, //                                 COL
  { value: 'moorland', label: 'Moorland' }, //                                         COL
  { value: 'community_council', label: 'Community Council' }, //                       COL
  { value: 'tropical_dry_forest', label: 'Tropical Dry Forest' }, //                   COL
  { value: 'national_natural_protected_area', label: 'National Natural Protected Area' }, //       COL
  { value: 'departmental_natural_protected_area', label: 'Departmental Natural Protected Area' }, // COL
  { value: 'choco_biogeographic', label: 'Chocó Biogeographic' }, //                   COL
  { value: 'glacial_complex', label: 'Glacial Complex' }, //                           COL
  { value: 'agricultural_frontier', label: 'Agricultural Frontier' }, //               COL
  { value: 'glaciers_colombia', label: 'Glaciers Colombia' }, //                       COL

  // BOL
  { value: 'national_protected_area', label: 'National Protected Area' }, //           BOL
  { value: 'subnational_protected_area', label: 'Subnational Protected Area' }, //     BOL
  { value: 'indigenous_territory', label: 'Indigenous Territory' }, //                 BOL
  { value: 'ecoregion', label: 'Ecoregion' }, //                                       BOL
  { value: 'ramsar_site', label: 'Ramsar Site' }, //                                   BOL

  // IDN
  { value: 'island', label: 'Island' }, //                                             IDN
  { value: 'new_indonesia_capital', label: 'New Indonesia Capital' }, //               IDN
  { value: 'indigenous_forest', label: 'Indigenous Forest' }, //                       IDN
  { value: 'watershed', label: 'Watershed' }, //                                       IDN
  { value: 'forest_moratorium', label: 'Forest Moratorium' }, //                       IDN
  { value: 'national_park', label: 'National Park' }, //                               IDN
  { value: 'key_biodiversity_area', label: 'Key Biodiversity Area' }, //               IDN
];

const TERRITORY_CATEGORY_LABEL = new Map<string, string>(
  TERRITORY_CATEGORIES.map((c) => [c.value, c.label]),
);

/**
 * Resolve a territory category to a display label. Falls back to a title-cased
 * version of the raw value (e.g. `watershed_level_1` → "Watershed Level 1") so
 * unlisted categories still render reasonably.
 */
export function getTerritoryCategoryLabel(category: string): string {
  const known = TERRITORY_CATEGORY_LABEL.get(category);
  if (known) return known;

  return category
    .split('_')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}
