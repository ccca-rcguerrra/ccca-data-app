import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS, DomainCreatedEvent, DomainProcessedEvent } from './events/domain.events';

@Injectable()
export class DomainListener {
  private readonly logger = new Logger(DomainListener.name);

  constructor(
    // private readonly otherDomainService: OtherDomainService,
  ) {}

  @OnEvent(DOMAIN_EVENTS.CREATED)
  async onDomainCreated(event: DomainCreatedEvent): Promise<void> {
    try {
      this.logger.log(`Domain created: ${event.id} (${event.name})`);
      // Side effects: sync, notify, log, etc.
    } catch (err) {
      this.logger.error(`Failed to handle domain.created for ${event.id}`, err);
      // DO NOT re-throw — fire-and-forget
    }
  }

  @OnEvent(DOMAIN_EVENTS.PROCESSED)
  async onDomainProcessed(event: DomainProcessedEvent): Promise<void> {
    try {
      this.logger.log(`Domain processed: ${event.itemId}`);
    } catch (err) {
      this.logger.error(`Failed to handle domain.processed for ${event.itemId}`, err);
    }
  }
}
