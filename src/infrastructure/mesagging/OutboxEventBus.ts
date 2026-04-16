import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@domain/events/DomainEvent';
import type { EventBus } from '@application/ports/EventBus';

/** Mínimo común de Pool y PoolClient. */
type Queryable = {
    query(text: string, values?: unknown[]): Promise<unknown>;
};

/**
 * Persiste cada DomainEvent en la tabla `outbox` sin publicarlo todavía.
 * El OutboxDispatcher se encarga de leer y despachar los eventos pendientes.
 *
 * Debe usarse dentro de la misma transacción que la escritura del aggregate
 * para garantizar consistencia (escribir orden + evento en el mismo commit).
 */
export class OutboxEventBus implements EventBus {
    constructor(private readonly db: Queryable) {}

    async publish(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.db.query(
                `INSERT INTO outbox (id, type, aggregate_id, occurred_at, published_at)
                 VALUES ($1, $2, $3, $4, NULL)`,
                [randomUUID(), event.eventType, event.aggregateId, event.occurredAt],
            );
        }
    }
}
