import { Link } from 'react-router';

import { ROUTES } from '@/constants/routes.constants';
import { cn } from '@/lib/utils';

export function personDetailPath(id: string): string {
  return ROUTES.semaspa.personDetail.replace(':id', encodeURIComponent(id));
}

interface PersonLinkProps {
  personId: string;
  className?: string;
  children: React.ReactNode;
}

export function PersonLink({ personId, className, children }: PersonLinkProps) {
  return (
    <Link
      to={personDetailPath(personId)}
      className={cn('text-primary hover:underline', className)}
    >
      {children}
    </Link>
  );
}
