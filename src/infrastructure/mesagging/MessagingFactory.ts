import type pg from 'pg';
import type { EventBus } from '@application/ports/EventBus';
import { NoopEventBus } from '@infrastructure/mesagging/NoopEventBus';
import { OutboxEventBus } from '@infrastructure/mesagging/OutboxEventBus';

/**
 * Devuelve la implementación de EventBus adecuada según el modo de ejecución:
 * - InMemory → NoopEventBus (descarta eventos, sin persistencia)
 * - Postgres  → OutboxEventBus (persiste en tabla `outbox`, entrega garantizada)
 */
export function buildEventBus(useInMemory: boolean, pool?: pg.Pool): EventBus {
    if (useInMemory) return new NoopEventBus();
    if (!pool) throw new Error('[messaging] Pool requerido para OutboxEventBus');
    return new OutboxEventBus(pool);
}
