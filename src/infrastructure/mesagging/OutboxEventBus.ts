import type { DomainEvent } from "@domain/events";
import type { EventBus } from  "@application/ports/EventBus";
import { randomUUID } from "crypto";

type Queryable = {query: (q: string, params?: any[]) => Promise<unknown>};

export class OutboxEventBus implements EventBus {
    constructor(private readonly db: Queryable) {};
    async publish(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.db.query(
                `INSERT INTO outbox (id, type, payload, ocurred_at, published_at) VALUES ($1, $2, $3, $4, $5)`,
                [randomUUID(), event.type, JSON.stringify(event.payload), event.ocurred_at.toISOString(), null]
            );
        }
    }
}