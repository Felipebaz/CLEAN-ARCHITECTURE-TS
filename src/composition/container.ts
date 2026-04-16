import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';
import { StaticPricingService } from '@infrastructure/pricing/StaticPricingService';
import { NoopEventBus } from '@infrastructure/mesagging/NoopEventBus';
import { ConsoleLogger } from '@infrastructure/http/observabillity/ConsoleLogger';
import { CreateOrderUseCase } from '@application/use-cases/CreateOrderUseCase';
import { AddItemToOrderUseCase } from '@application/use-cases/AddItemToOrderUseCase';

export function buildContainer() {
    // Puertos
    const orders   = new InMemoryOrderRepository();
    const pricing  = new StaticPricingService();
    const eventBus = new NoopEventBus();
    const logger   = new ConsoleLogger();

    // Casos de uso
    const createOrder    = new CreateOrderUseCase(orders, eventBus, logger);
    const addItemToOrder = new AddItemToOrderUseCase(orders, pricing, eventBus, logger);

    return {
        ports:    { orders, pricing, eventBus, logger },
        useCases: { createOrder, addItemToOrder },
    };
}

export type AppContainer = ReturnType<typeof buildContainer>;
