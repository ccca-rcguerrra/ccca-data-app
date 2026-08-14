import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { ROUTES } from '@/constants/routes.constants';
import { useAppConfig } from '@/hooks/api/use-app-config';
import type { FeatureFlags } from '@/types/app-config';

interface FeatureRouteProps {
  /** AppConfig feature that must be enabled for this initiative. */
  feature: keyof FeatureFlags;
  children: ReactNode;
}

/**
 * Route guard that only renders its children when the given AppConfig feature is
 * enabled for the current initiative (e.g. Support Cases, Brazil-only). Waits for
 * the config to resolve before deciding, then redirects home when disabled.
 */
export default function FeatureRoute({ feature, children }: FeatureRouteProps) {
  const { data, isLoading, isFetched } = useAppConfig();

  // Wait for the config to settle so we don't redirect before it loads.
  if (isLoading || !isFetched) return null;

  if (data?.features?.[feature] !== true) {
    return <Navigate to={ROUTES.root} replace />;
  }

  return <>{children}</>;
}
