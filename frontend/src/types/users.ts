// User types aligned with API (users controller + DTOs)

/**
 * User roles — mirrors UserRole enum on the backend (model.enums.ts)
 */
export type UserRole =
  | 'admin'
  | 'coordinator'
  | 'analyst_senior'
  | 'analyst_midlevel'
  | 'analyst_junior'
  | 'analyst_support'
  | 'viewer';

/**
 * Online user — returned by GET /api/users/online
 */
export interface OnlineUser {
  id: number;
  name: string;
  email: string;
  photo: string | null;
}

import type { Team } from './teams';

/**
 * User data from API (matches GetUserResponseDto / UserDto).
 * Password is never returned by the API.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  photo: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  institution?: string | null;
  teams?: Team[];
  roles?: UserRole[];
  /** Only present when sending create/update; API never returns password */
  password?: string;
}

/**
 * Query parameters for listing users (matches GetUsersQueryDto)
 */
export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  teamId?: number[];
}

/**
 * Payload for POST /api/users (matches CreateUserDto)
 */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  photo?: string | null;
  status?: number;
  institution?: string | null;
  teamIds?: number[];
  roles?: UserRole[];
}

/**
 * Payload for PATCH /api/users/:id (matches UpdateUserDto).
 * id is required in body; other fields are optional.
 */
export interface UpdateUserDto {
  id: number;
  name?: string;
  email?: string;
  password?: string;
  photo?: string | null;
  status?: number;
  institution?: string | null;
  teamIds?: number[];
  roles?: UserRole[];
}


