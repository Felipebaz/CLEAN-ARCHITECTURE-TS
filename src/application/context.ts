import type { OrderRepository } from './ports/OrderRepository.js';
import type { PricingService } from './ports/PricingService.js';
import type { EventBus } from './ports/EventBus.js';
import type { Clock } from './ports/Clock.js';
import type { Logger } from './ports/Logger.js';

export type AppContext = {
    orders: OrderRepository;
    pricing: PricingService;
    eventBus: EventBus;
    clock: Clock;
    logger: Logger;
};
