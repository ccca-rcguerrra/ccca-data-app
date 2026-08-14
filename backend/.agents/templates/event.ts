export const DOMAIN_EVENTS = {
  CREATED: 'domain.created',
  UPDATED: 'domain.updated',
  DELETED: 'domain.deleted',
  PROCESSED: 'domain.processed',
} as const;

export class DomainCreatedEvent {
  id: number;
  userId: number;
  name: string;
}

export class DomainUpdatedEvent {
  id: number;
  changes: Record<string, unknown>;
}

export class DomainProcessedEvent {
  itemId: number;
  result: unknown;
}
