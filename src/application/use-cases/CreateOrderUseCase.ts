import { Order } from '@domain/entities/Order';
import { OrderId } from '@domain/value-objects/OrderId';
import { CustomerId } from '@domain/value-objects/CustomerId';
import { Currency } from '@domain/value-objects/Currency';
import { DomainError } from '@domain/errors/DomainError';
import type { OrderRepository } from '../ports/OrderRepository.js';
import type { EventBus } from '../ports/EventBus.js';
import type { Logger } from '../ports/Logger.js';
import { type Result, ok, err } from '../result.js';
import { AppError } from '../errors/AppError.js';
import type { CreateOrderInput, CreateOrderOutput } from '../dtos/CreateOrderDTO.js';

export class CreateOrderUseCase {
    constructor(
        private readonly orders: OrderRepository,
        private readonly eventBus: EventBus,
        private readonly logger: Logger,
    ) {}

    async execute(input: CreateOrderInput): Promise<Result<CreateOrderOutput, AppError>> {
        // 1. Construir VOs — cualquier invariante roto es ValidationError
        let orderId: OrderId;
        let customerId: CustomerId;
        let currency: Currency;

        try {
            orderId = OrderId.create(input.orderId);
            customerId = CustomerId.create(input.customerId);
            currency = Currency.create(input.currency);
        } catch (e) {
            if (e instanceof DomainError) {
                return err(AppError.validation(e.message));
            }
            return err(AppError.infra(e));
        }

        // 2. Idempotencia — el pedido no debe existir ya
        let existing: Order | null;
        try {
            existing = await this.orders.findById(orderId);
        } catch (e) {
            return err(AppError.infra(e));
        }

        if (existing !== null) {
            return err(AppError.conflict(`Order ${orderId.value} already exists`));
        }

        // 3. Crear el aggregate y persistir
        const order = Order.create(orderId, customerId, currency);

        try {
            await this.orders.save(order);
        } catch (e) {
            return err(AppError.infra(e));
        }

        // 4. Publicar eventos de dominio
        const events = order.pullDomainEvents();
        try {
            await this.eventBus.publish(events);
        } catch (e) {
            // El pedido ya está guardado; loguear y no fallar la operación
            this.logger.error('Failed to publish domain events', { orderId: orderId.value, cause: e });
        }

        this.logger.info('Order created', { orderId: orderId.value });
        return ok({ orderId: orderId.value });
    }
}
