import type { Pool } from 'pg';
import type { OrderRepository } from '@application/ports/OrderRepository';
import { PostgresOrderRepository } from './PosgresOrderRepository';

// ─── repos expuestos dentro del UoW ─────────────────────────────────────────

export type UowRepos = {
    readonly orders: OrderRepository;
};

// ─── unit of work ────────────────────────────────────────────────────────────

/**
 * Ejecuta `work` dentro de una única transacción de PostgreSQL.
 *
 * - Adquiere un PoolClient del pool.
 * - Emite BEGIN antes de llamar a `work`.
 * - Emite COMMIT si `work` resuelve sin lanzar.
 * - Emite ROLLBACK y re-lanza si `work` lanza.
 * - Libera el cliente en cualquier caso (finally).
 *
 * Todos los repositorios que recibe `work` comparten el mismo cliente,
 * por lo que sus operaciones participan en la misma transacción.
 */
export class PgUnitOfWork {
    constructor(private readonly pool: Pool) {}

    async run<T>(work: (repos: UowRepos) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const repos: UowRepos = {
                orders: new PostgresOrderRepository(client),
            };

            const result = await work(repos);

            await client.query('COMMIT');
            return result;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
