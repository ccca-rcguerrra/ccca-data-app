import { persist } from 'zustand/middleware';
import { create } from 'zustand';

import type { AuthTokens, AuthUser } from '@/types/auth';
import { StorageService } from '@/services/storage/storage.service';
import { STORAGE_KEYS } from '@/constants';

/**
 * Estado do domínio de autenticação.
 */
export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

/**
 * Ações do domínio de autenticação.
 */
export interface AuthActions {
  setSession: (user: AuthUser | null, tokens: AuthTokens | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  logout: () => void;
}

/** Bump to discard every persisted session after a breaking change to AuthState. */
const AUTH_STORE_VERSION = 1;

const EMPTY_SESSION: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
};

function isValidUser(user: unknown): user is AuthUser {
  if (!user || typeof user !== 'object') return false;

  const candidate = user as Partial<AuthUser>;

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.email === 'string' &&
    (candidate.roles === undefined || Array.isArray(candidate.roles)) &&
    (candidate.permissions === undefined || Array.isArray(candidate.permissions)) &&
    (candidate.teamIds === undefined || Array.isArray(candidate.teamIds))
  );
}

function isValidTokens(tokens: unknown): tokens is AuthTokens {
  if (!tokens || typeof tokens !== 'object') return false;

  return typeof (tokens as Partial<AuthTokens>).accessToken === 'string';
}

/**
 * Persisted state may come from an older build or from another application that
 * shares the same origin. Anything that does not match the expected shape is
 * dropped, so the app falls back to a logged out session instead of hydrating
 * data that would break at runtime.
 */
function parsePersistedSession(persisted: unknown): AuthState {
  if (!persisted || typeof persisted !== 'object') return EMPTY_SESSION;

  const { user, tokens } = persisted as Partial<AuthState>;

  if (!isValidUser(user) || !isValidTokens(tokens)) return EMPTY_SESSION;

  return { user, tokens, isAuthenticated: Boolean(tokens.accessToken) };
}

/**
 * Store de autenticação isolada.
 * Responsável apenas por sessão e tokens.
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setSession: (user, tokens) => {
        set({
          user,
          tokens,
          isAuthenticated: Boolean(user && tokens?.accessToken),
        });
      },

      setTokens: (tokens) => {
        const user = get().user;

        set({
          tokens,
          isAuthenticated: Boolean(user && tokens?.accessToken),
        });
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      version: AUTH_STORE_VERSION,
      storage: StorageService.createPersistStorage(),
      migrate: () => EMPTY_SESSION,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedSession(persistedState),
      }),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

