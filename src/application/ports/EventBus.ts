import type { DomainEvent } from '@domain/events/DomainEvent';

export interface EventBus {
    publish(events: DomainEvent[]): Promise<void>;
}
