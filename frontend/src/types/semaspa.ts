import type { MultiPolygon } from 'geojson';
import type { ApiPaginatedResponse } from '@/types/api';

export interface SemaspaPaginationParams {
  page?: number;
  limit?: number;
}

export type AutefVolumeBalanceSortField =
  | 'excessVolume'
  | 'movedRatio'
  | 'authorizedVolume'
  | 'id';

export interface AutefVolumeBalanceParams extends SemaspaPaginationParams {
  sortBy?: AutefVolumeBalanceSortField;
  sortOrder?: 'ASC' | 'DESC';
}

export type AutefSortField =
  | 'id'
  | 'number'
  | 'issuedAt'
  | 'city'
  | 'issueYear'
  | 'totalAreaHa';

export type ForestGuideSortField = 'id' | 'number' | 'issuedAt' | 'status' | 'type';

export interface Autef {
  id: number;
  title: string | null;
  number: string | null;
  issuedAt: string | null;
  city: string | null;
  state: string | null;
  latitude: string | null;
  longitude: string | null;
  totalAreaHa: number | null;
  processNumber: string | null;
  issueYear: number | null;
  issueMonth: number | null;
  geometry?: MultiPolygon | null;
  bbox?: [number, number, number, number] | null;
}

export interface AutefListParams extends SemaspaPaginationParams {
  search?: string;
  city?: string;
  state?: string;
  issueYear?: number;
  issueMonth?: number;
  processNumber?: string;
  issuedFrom?: string;
  issuedTo?: string;
  taxId?: string;
  personName?: string;
  isOverExtracted?: boolean;
  hasForestGuide?: boolean;
  movedRatioMin?: number;
  movedRatioMax?: number;
  speciesProductId?: string;
  scientificName?: string;
  commonName?: string;
  sortBy?: AutefSortField;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AutefSpecies {
  id: string;
  autefId: number;
  speciesProductId: string;
  volume: number | null;
  unit: string | null;
}

export interface AutefVolumeBalance {
  id: string;
  autefId: number;
  speciesProductId: string;
  authorizedVolume: number | null;
  authorizedUnit: string | null;
  authorizedUnitCount: number | null;
  movedVolume: number | null;
  movedUnit: string | null;
  movedUnitCount: number | null;
  movedRatio: number | null;
  excessVolume: number | null;
  isOverExtracted: boolean;
  hasUnitConflict: boolean;
}

export interface VolumeBalanceForestGuide {
  forestGuideId: number;
  number: string | null;
  issuedAt: string | null;
  status: string | null;
  type: string | null;
  volume: number | null;
  unit: string | null;
  speciesProductId: string;
  runningTotal: number;
}

export interface VolumeBalanceForestGuidesResponse
  extends ApiPaginatedResponse<VolumeBalanceForestGuide> {
  movedVolumeSum: number | null;
  crossingForestGuideId: number | null;
}

export interface ForestGuide {
  id: number;
  number: string | null;
  issuedAt: string | null;
  status: string | null;
  type: string | null;
  permitRefs: string[] | null;
  vehiclePlates: string[] | null;
}

export interface ForestGuideListParams extends SemaspaPaginationParams {
  search?: string;
  status?: string;
  type?: string;
  issuedFrom?: string;
  issuedTo?: string;
  autefId?: number;
  taxId?: string;
  personName?: string;
  speciesProductId?: string;
  scientificName?: string;
  commonName?: string;
  plate?: string;
  permitRef?: string;
  volumeMin?: number;
  volumeMax?: number;
  valueMin?: number;
  valueMax?: number;
  sortBy?: ForestGuideSortField;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ForestGuideSpecies {
  id: string;
  forestGuideId: number;
  speciesProductId: string;
  volume: number | null;
  unit: string | null;
  value: number | null;
}

export interface HarvestUnit {
  id: number;
  holder: string | null;
  propertyName: string | null;
  processNumber: string | null;
  autefNumber: string | null;
  autefYear: string | null;
  autefValidity: string | null;
  city: string | null;
  propertyAreaHa: string | null;
  unitAreaHa: string | null;
  netAreaHa: string | null;
  volumeM3: string | null;
  geometry?: MultiPolygon | null;
  bbox?: [number, number, number, number] | null;
}

export interface HarvestUnitsParams extends SemaspaPaginationParams {
  withGeom?: boolean;
}

export interface PersonRole {
  id: string;
  entityType: string;
  entityId: number;
  personId: string;
  role: string;
  source: string;
}

export interface PersonListParams extends SemaspaPaginationParams {
  search?: string;
}

export interface PersonParticipation {
  ownerAutefCount: number;
  technicalResponsibleAutefCount: number;
  analystAutefCount: number;
  originGfCount: number;
  destinationGfCount: number;
  distinctAutefCount: number;
  distinctGfCount: number;
}

export interface PersonLinkedAutef {
  role: string;
  source: string;
  autef: Autef;
}

export interface PersonLinkedForestGuide {
  role: string;
  source: string;
  forestGuide: ForestGuide;
}

export interface Person {
  id: string;
  taxId: string | null;
  names: string[] | null;
  roleTypes: string[] | null;
  sources: string[] | null;
  stateRegistration: string | null;
  ceprofRegistration: string | null;
  ctfRegistration: string | null;
  address: string | null;
  district: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  occurrenceCount: number | null;
}

export interface SpeciesProduct {
  id: string;
  scientificName: string | null;
  commonName: string | null;
  productName: string | null;
  source: string | null;
  occurrenceCount: number | null;
}

export const INDICATOR_IDS = {
  OVER_EXTRACTED: 'autef_over_extracted',
  CREDIT_USE_OVER_90: 'autef_credit_use_over_90',
  UNIT_CONFLICT: 'autef_unit_conflict',
  PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS: 'person_multiple_over_extracted_autefs',
  PERSON_RECURRENT_GF_DESTINATION: 'person_recurrent_gf_destination',
  PLATE_RECURRENT: 'plate_recurrent',
} as const;

export const ANY_INDICATOR_ID = 'any';

export type CatalogIndicatorId =
  (typeof INDICATOR_IDS)[keyof typeof INDICATOR_IDS];

export type IndicatorQueryId = CatalogIndicatorId | typeof ANY_INDICATOR_ID;

export type IndicatorEntity = 'autef' | 'person' | 'plate';

export interface IndicatorFilters {
  city?: string;
  state?: string;
  issuedFrom?: string;
  issuedTo?: string;
  speciesProductId?: string;
  scientificName?: string;
  commonName?: string;
  movedRatioMin?: number;
  movedRatioMax?: number;
  excessVolumeMin?: number;
}

export interface IndicatorSummaryItem {
  id: CatalogIndicatorId;
  name: string;
  entity: IndicatorEntity | string;
  severity: string;
  count: number;
  rule: string;
  ruleVersion: number;
  inputs: string[];
  limitations: string[];
}

export interface IndicatorSummary {
  generatedAt: string;
  filters: IndicatorFilters;
  indicators: IndicatorSummaryItem[];
}

export type IndicatorCaseSortField =
  | 'issuedAt'
  | 'number'
  | 'city'
  | 'maxMovedRatio'
  | 'maxExcessVolume';

export interface IndicatorCasesParams extends IndicatorFilters, SemaspaPaginationParams {
  sortBy?: IndicatorCaseSortField;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AutefIndicatorCase {
  entity: 'autef';
  autefId: number;
  number: string | null;
  city: string | null;
  state: string | null;
  issuedAt: string | null;
  matchedIndicatorIds: string[];
  maxMovedRatio: number | null;
  maxExcessVolume: number | null;
  hasUnitConflict: boolean;
}

export interface PersonIndicatorCase {
  entity: 'person';
  personId: string;
  names: string[] | null;
  taxId: string | null;
  city: string | null;
  state: string | null;
  roleTypes: string[] | null;
  distinctAutefCount: number;
  distinctGfCount: number;
}

export interface PlateIndicatorCase {
  entity: 'plate';
  plate: string;
  distinctGfCount: number;
  distinctAutefCount: number;
}

export type IndicatorCase = AutefIndicatorCase | PersonIndicatorCase | PlateIndicatorCase;

export function isAutefIndicatorCase(row: IndicatorCase): row is AutefIndicatorCase {
  return row.entity === 'autef';
}

export function isPersonIndicatorCase(row: IndicatorCase): row is PersonIndicatorCase {
  return row.entity === 'person';
}

export function isPlateIndicatorCase(row: IndicatorCase): row is PlateIndicatorCase {
  return row.entity === 'plate';
}

export interface IndicatorSavedFilter {
  id: number;
  name: string;
  indicatorId: CatalogIndicatorId | typeof ANY_INDICATOR_ID | null;
  filters: IndicatorFilters;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIndicatorSavedFilterPayload {
  name: string;
  indicatorId?: CatalogIndicatorId | typeof ANY_INDICATOR_ID | null;
  filters: IndicatorFilters;
}

export interface UpdateIndicatorSavedFilterPayload {
  name?: string;
  indicatorId?: CatalogIndicatorId | typeof ANY_INDICATOR_ID | null;
  filters?: IndicatorFilters;
}
