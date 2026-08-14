import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';
import type {
  AuthUser,
  AuthTokens,
  LoginPayload,
  LoginData,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth';

/**
 * Auth service for managing authentication
 */
export class AuthService {
  private static readonly BASE_URL = '/api/auth';

  /**
   * Login with email and password
   */
  static async login(payload: LoginPayload): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const response = await api.post<ApiResponse<LoginData>>(`${AuthService.BASE_URL}/login`, payload);
    
    // Convert API response to internal structure
    // API returns { data: { access_token, token_type, expires_in, user } }
    const loginData = response.data.data;
    const tokens: AuthTokens = {
      accessToken: loginData.access_token,
      refreshToken: loginData.access_token, // API doesn't provide refresh token, using access token
      accessTokenExp: Date.now() + (loginData.expires_in * 1000)
    };

    return {
      user: loginData.user,
      tokens
    };
  }

  /**
   * Get current authenticated user
   */
  static async getMe(): Promise<AuthUser> {
    const response = await api.get<ApiResponse<AuthUser>>(`${AuthService.BASE_URL}/me`);
    // API returns { data: AuthUser }
    return response.data.data;
  }

  /**
   * Refresh authentication tokens
   * Note: API doesn't have refresh endpoint, returns null
   */
  static async refreshTokens(): Promise<AuthTokens | null> {
    return null;
  }

  /**
   * Request a password reset email
   */
  static async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await api.post(`${AuthService.BASE_URL}/forgot-password`, payload);
  }

  /**
   * Reset password using the token from email
   */
  static async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await api.post(`${AuthService.BASE_URL}/reset-password`, payload);
  }

}

// Export individual functions for convenience
export const {
  login: loginUser,
  getMe: getCurrentUser,
  refreshTokens: refreshAuthTokens,
  forgotPassword: requestPasswordReset,
  resetPassword: resetUserPassword,
} = AuthService;

// Export the service class as default
export default AuthService;

