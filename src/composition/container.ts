import { createOrder } from '@compostition/containers';
import { AddItemToOrder } from '@application/use-cases/AddItemToOrder';
import { AddItemToOrder } from '@application/use-cases/AddItemToOrder';
import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';
import { CreateOrderUseCase } from '@application/use-cases/CreateOrderUseCase';
import { PostgresOrderRespository } from "@infrastructure/persistence/postgres/PostgresOrderRepository";
import { HttpPricingService } from "@infrastructure/http/HttpPricingService";
import { OutboxEventBus } from '@infrastructure/mesagging/OutboxEventBus';
import { AddItemToOrder} from '@application/use-cases/AddItemToOrder';
import { PinoLogger } from '@infrastructure/http/observabillity/PinoLogger';
import { Pool } from 'pg';


export funcition buildContainer() {
    const cfg = loadConfig();
    const logger = new PinoLogger();
    const pool = cfg.USE_IN_MEMORY_DB === 'true' ? null : new Pool({ connectionString: cfg.DATABASE_URL });
    const orders = cfg.USE_IN_MEMORY_DB === 'true' ? new InMemoryOrderRepository() : new PostgresOrderRespository(pool);
    const pricingService = new HttpPricingService(cfg.PRICING_BASE_URL);
    const eventBus = cfg.USE_IN_MEMORY_DB === 'true' ? {publish: async () => {}} : new OutboxEventBus(orders);
    const clock = {now: () => new Date()};

    const createOrder = new CreateOrderUseCase(orders, eventBus);
    
}
const repo = new InMemoryOrderRepository();
const env = process.env;
const pool = new Pool({ connectionString: env.DATABASE_URL });
const orders = 
  env.USE_IN_MEMORY_DB === 'true'
    ? new InMemoryOrderRepository()
    : new PostgresOrderRespository(pool);
const pricingService = new HttpPricingService(env.PRICING_SERVICE_URL ?? 'http://localhost:3000');
const eventBus = new OutboxEventBus(orders);
export const logger = new PinoLogger();
export const AddItemToOrder = new AddItemToOrder(orders, pricingService, eventBus, logger);