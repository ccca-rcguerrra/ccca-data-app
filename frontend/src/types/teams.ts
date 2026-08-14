import type { Territory } from './territories';

/**
 * User data structure in team context
 */
export interface TeamUser {
  id: number;
  name: string;
  email: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team data structure from API (matches TypeORM Team entity)
 */
export interface Team {
  id: number;
  name: string;
  territoryId: number | null;
  createdAt: string;
  updatedAt: string;
  territories?: Territory[];
  usersCount: number;
  users?: TeamUser[];
}

/**
 * Query parameters for listing teams
 */
export interface TeamsListParams {
  page?: number;
  limit?: number;
  search?: string;
  users?: number[];
}


/**
 * Create team payload
 */
export interface CreateTeam {
  name: string;
  territoryId?: number | null;
  userIds?: number[];
}

/**
 * Update team payload
 */
export interface UpdateTeam {
  name?: string;
  territoryId?: number | null;
  userIds?: number[];
}




