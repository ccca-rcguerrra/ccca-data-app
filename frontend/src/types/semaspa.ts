import type { MultiPolygon } from 'geojson';

export interface SemaspaPaginationParams {
  page?: number;
  limit?: number;
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
