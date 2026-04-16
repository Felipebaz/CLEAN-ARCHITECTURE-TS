import type pg from 'pg';
import type { Config } from '@composition/config';
import { buildPool } from '@infrastructure/database/DataBaseFactory';
import { buildEventBus } from '@infrastructure/mesagging/MessagingFactory';
import { OutboxDispatcher } from '@infrastructure/mesagging/OutboxDispatcher';
import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';
import { PostgresOrderRepository } from '@infrastructure/persistence/postgres/PosgresOrderRepository';
import { StaticPricingService } from '@infrastructure/pricing/StaticPricingService';
import { PinoLogger } from '@infrastructure/http/observabillity/PinoLogger';
import { CreateOrderUseCase } from '@application/use-cases/CreateOrderUseCase';
import { AddItemToOrderUseCase } from '@application/use-cases/AddItemToOrderUseCase';

export function buildContainer(config: Config) {
    const logger = new PinoLogger();

    // ── Persistence ────────────────────────────────────────────────────────────
    let pool: pg.Pool | undefined;

    const orders = config.USE_IN_MEMORY
        ? new InMemoryOrderRepository()
        : (() => {
            pool = buildPool(config);
            return new PostgresOrderRepository(pool);
        })();

    // ── Messaging ─────────────────────────────────────────────────────────────
    const eventBus = buildEventBus(config.USE_IN_MEMORY, pool);

    // ── Outbox dispatcher (solo Postgres) ─────────────────────────────────────
    let dispatcher: OutboxDispatcher | undefined;

    if (!config.USE_IN_MEMORY && pool) {
        // El handler puede conectarse a un broker real en el futuro.
        // Por ahora loguea el evento para que quede traza sin bloquearse.
        dispatcher = new OutboxDispatcher(
            pool,
            async event => {
                logger.info('[outbox] event dispatched', {
                    id:   event.id,
                    type: event.type,
                });
            },
            logger,
        );
        dispatcher.start();
    }

    // ── Pricing ───────────────────────────────────────────────────────────────
    const pricing = new StaticPricingService();

    // ── Use cases ─────────────────────────────────────────────────────────────
    const createOrder    = new CreateOrderUseCase(orders, eventBus, logger);
    const addItemToOrder = new AddItemToOrderUseCase(orders, pricing, eventBus, logger);

    // ── Shutdown ──────────────────────────────────────────────────────────────
    async function shutdown(): Promise<void> {
        dispatcher?.stop();
        await pool?.end();
    }

    return {
        ports:    { orders, pricing, eventBus, logger },
        useCases: { createOrder, addItemToOrder },
        shutdown,
    };
}

export type AppContainer = ReturnType<typeof buildContainer>;
