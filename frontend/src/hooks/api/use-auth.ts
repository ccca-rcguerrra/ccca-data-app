import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/services/auth/auth.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { useAuthStore } from '@/stores';
import type { LoginPayload, ForgotPasswordPayload, ResetPasswordPayload } from '@/types/auth';

/**
 * Hook to get current authenticated user
 */
export const useAuthUserQuery = (enabled = true) => {
  const tokens = useAuthStore((s) => s.tokens);
  
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthService.getMe(),
    enabled: enabled && !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
  });
};

/**
 * Hook to login user
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => AuthService.login(payload),
    onSuccess: (data) => {
      // Set session in store (persists tokens)
      setSession(data.user, data.tokens);
      
      // Set user data in query cache
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
    onError: (error) => {
      console.error('Error logging in:', error);
    },
  });
};

/**
 * Hook to request a password reset email
 */
export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => AuthService.forgotPassword(payload),
  });
};

/**
 * Hook to reset password with email token
 */
export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => AuthService.resetPassword(payload),
  });
};

/**
 * Hook to logout user
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: async () => {
      logout();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.users.online() });
    },
  });
};

/**
 * Main auth hook that provides all auth state and actions
 * Maintains backward compatibility with existing code
 */
export function useAuth() {
  const tokens = useAuthStore((s) => s.tokens);
  const storeUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const { data: queryUser, isLoading: isLoadingUser, refetch: refetchUser } = useAuthUserQuery(!!tokens?.accessToken);
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  // Use query user if available, otherwise fallback to store user
  const user = queryUser ?? storeUser;

  return {
    user: user ?? null,
    isAuthenticated: isAuthenticated && !!user,
    isLoading: isLoadingUser || loginMutation.isPending,
    login: loginMutation.mutateAsync,
    logout: () => logoutMutation.mutate(),
    fetchMe: async () => {
      if (!tokens?.accessToken) return;
      try {
        const user = await AuthService.getMe();
        useAuthStore.getState().setSession(user, tokens);
        // Refetch query to update cache
        await refetchUser();
      } catch {
        useAuthStore.getState().logout();
      }
    },
  };
}
