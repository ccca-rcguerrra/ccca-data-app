import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route handler as public, bypassing the global JwtAuthGuard.
 *
 * Use sparingly — only for endpoints that must be reachable without an
 * Authorization header (e.g. an <img src> proxy that the browser fetches
 * without a JWT), protected by an unguessable capability token in the URL.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
