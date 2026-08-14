import { useEffect } from 'react';
import { usePublicInitiativeMetadata } from '@/hooks/api/use-app-config';

const FALLBACK_TITLE = 'Workspace';

/** Sets the browser tab title from public initiative metadata. */
export function useDocumentTitle() {
  const { data: initiative } = usePublicInitiativeMetadata();

  useEffect(() => {
    document.title = initiative?.name?.trim() || FALLBACK_TITLE;
  }, [initiative?.name]);
}
