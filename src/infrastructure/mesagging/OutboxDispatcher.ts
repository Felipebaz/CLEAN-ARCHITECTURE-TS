import type { Pool, QueryResultRow } from 'pg';
import type { Logger } from '@application/ports/Logger';

// ─── tipos públicos ───────────────────────────────────────────────────────────

/** Evento leído del outbox antes de ser despachado. */
export type OutboxEvent = {
    readonly id:          string;
    readonly type:        string;
    readonly aggregateId: string;
    readonly occurredAt:  Date;
};

/**
 * Función que procesa un evento del outbox.
 * Si lanza, la fila permanece sin `published_at` y se reintentará.
 */
export type DispatchHandler = (event: OutboxEvent) => Promise<void>;

// ─── row shape ────────────────────────────────────────────────────────────────

type OutboxRow = QueryResultRow & {
    id:           string;
    type:         string;
    aggregate_id: string;
    occurred_at:  Date;
};

// ─── dispatcher ───────────────────────────────────────────────────────────────

export class OutboxDispatcher {
    private timer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly pool:    Pool,
        private readonly handler: DispatchHandler,
        private readonly logger:  Logger,
    ) {}

    /**
     * Lee hasta `batchSize` eventos no publicados con FOR UPDATE SKIP LOCKED,
     * llama al handler por cada uno y marca `published_at = now()`.
     *
     * - SKIP LOCKED permite que varios dispatchers corran en paralelo sin
     *   bloquearse entre sí.
     * - Si el handler lanza, se hace ROLLBACK y los eventos quedan pendientes
     *   para el siguiente intento.
     *
     * @returns número de eventos despachados en este ciclo.
     */
    async dispatchPending(batchSize = 100): Promise<number> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query<OutboxRow>(
                `SELECT id, type, aggregate_id, occurred_at
                 FROM outbox
                 WHERE published_at IS NULL
                 ORDER BY occurred_at
                 FOR UPDATE SKIP LOCKED
                 LIMIT $1`,
                [batchSize],
            );

            for (const row of rows) {
                const event: OutboxEvent = {
                    id:          row.id,
                    type:        row.type,
                    aggregateId: row.aggregate_id,
                    occurredAt:  row.occurred_at,
                };

                await this.handler(event);

                await client.query(
                    'UPDATE outbox SET published_at = now() WHERE id = $1',
                    [row.id],
                );
            }

            await client.query('COMMIT');
            return rows.length;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Inicia un polling periódico que llama a `dispatchPending` cada
     * `intervalMs` milisegundos. Los errores se logean sin detener el loop.
     */
    start(intervalMs = 5_000, batchSize = 100): void {
        if (this.timer !== null) return;

        this.timer = setInterval(() => {
            this.dispatchPending(batchSize).then(count => {
                if (count > 0) {
                    this.logger.info('[outbox] dispatched events', { count });
                }
            }).catch(err => {
                this.logger.error('[outbox] dispatch error', { cause: String(err) });
            });
        }, intervalMs);

        this.logger.info('[outbox] dispatcher started', { intervalMs, batchSize });
    }

    /** Detiene el polling. Esperar a que el ciclo en curso termine es
     *  responsabilidad del llamador (ej. en el shutdown hook del servidor). */
    stop(): void {
        if (this.timer === null) return;
        clearInterval(this.timer);
        this.timer = null;
        this.logger.info('[outbox] dispatcher stopped');
    }
}
