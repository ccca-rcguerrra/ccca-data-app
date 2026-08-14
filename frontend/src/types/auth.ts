// User data structure from API (matches OpenAPI AuthUserDto)
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  photo: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  roles?: string[];
  permissions?: string[];
  /** IDs of the teams this user belongs to. */
  teamIds?: number[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExp?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// API Response structure for /api/auth/login (matches OpenAPI)
export interface LoginData {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}


// Internal app structure
export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
