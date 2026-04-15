import { loadConfig } from '@compostition/config';
import { InMemoryOrderRepository } from '@infrastructure/persistence/in-memory/InMemoryOrderRepository';
import { PostgresOrderRespository } from "@infrastructure/persistence/postgres/PostgresOrderRepository";
import { HttpPricingService } from "@infrastructure/http/HttpPricingService";
import { OutboxEventBus } from '@infrastructure/mesagging/OutboxEventBus';
import { AddItemToOrder} from '@application/use-cases/AddItemToOrder';
import { CreateOrderUseCase } from '@application/use-cases/CreateOrderUseCase';
import { PinoLogger } from '@infrastructure/http/observabillity/PinoLogger';
import { Pool } from 'pg';


export function buildContainer() {
    const cfg = loadConfig();
    const logger = new PinoLogger();
    const pool = cfg.USE_IN_MEMORY_DB === 'true' ? null : new Pool({ connectionString: cfg.DATABASE_URL });
    const orders = cfg.USE_IN_MEMORY_DB === 'true' ? new InMemoryOrderRepository() : new PostgresOrderRespository(pool);
    const pricingService = new HttpPricingService(cfg.PRICING_BASE_URL);
    const eventBus = cfg.USE_IN_MEMORY_DB === 'true' ? {publish: async () => {}} : new OutboxEventBus(orders);
    const clock = {now: () => new Date()};

    const createOrder = new CreateOrderUseCase(orders, eventBus);
    const addItemToOrder = new AddItemToOrder(orders, pricingService, eventBus, clock);

    return {cfg, logger, pool,
        ports: {orders, pricingService, eventBus, clock},
        useCases: {createOrder, addItemToOrder}
    };  
}
export type AppContainer = ReturnType<typeof buildContainer>;

