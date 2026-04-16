import type { DomainEvent } from '@domain/events/DomainEvent';
import type { EventBus } from '@application/ports/EventBus';

export class NoopEventBus implements EventBus {
    async publish(_events: DomainEvent[]): Promise<void> {
        // no-op: descarta los eventos silenciosamente
    }
}
