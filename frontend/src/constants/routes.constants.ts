export const ROUTES = {
  root: '/',
  auth: {
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/reset-password',
  },
  dashboard: {
    root: '/dashboard',
  },
  users: {
    root: '/users',
    list: '/users/list',
  },
  teams: {
    root: '/teams',
    list: '/teams/list',
  },
  semaspa: {
    root: '/semaspa',
    autefs: '/semaspa/autefs',
    autefDetail: '/semaspa/autefs/:id',
    forestGuides: '/semaspa/forest-guides',
    forestGuideDetail: '/semaspa/forest-guides/:id',
  },
} as const;

export const toChildPath = (absolutePath: string): string =>
  absolutePath.startsWith('/') ? absolutePath.slice(1) : absolutePath;
