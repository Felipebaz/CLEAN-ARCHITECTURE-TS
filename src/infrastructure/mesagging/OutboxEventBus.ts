import type { DomainEvent } from "@domain/events/DomainEvent";
import type { EventBus } from  "@application/ports/EventBus";
import { randomUUID } from "crypto";

type Queryable = {query: (q: string, params?: any[]) => Promise<unknown>};

export class OutboxEventBus implements EventBus {
    constructor(private readonly db: Queryable) {};
    async publish(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.db.query(
                `INSERT INTO outbox (id, type, aggregate_id, occurred_at, published_at) VALUES ($1, $2, $3, $4, $5)`,
                [randomUUID(), event.eventType, event.aggregateId, event.occurredAt.toISOString(), null]
            );
        }
    }
}