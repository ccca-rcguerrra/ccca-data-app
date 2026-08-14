import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/api/use-auth';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes.constants';
import { buildLoginUrlWithReturn } from '@/pages/auth/utils/resolve-safe-return-url';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const returnPath = `${location.pathname}${location.search}`;
    return <Navigate to={buildLoginUrlWithReturn(returnPath)} replace />;
  }

  return <>{children}</>;
}
