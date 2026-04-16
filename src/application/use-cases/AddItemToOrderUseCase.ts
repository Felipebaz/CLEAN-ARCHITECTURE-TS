import { OrderId } from '@domain/value-objects/OrderId';
import { SKU } from '@domain/value-objects/SKU';
import { Quantity } from '@domain/value-objects/Quantity';
import { DomainError } from '@domain/errors/DomainError';
import type { OrderRepository } from '../ports/OrderRepository.js';
import type { PricingService } from '../ports/PricingService.js';
import type { EventBus } from '../ports/EventBus.js';
import type { Logger } from '../ports/Logger.js';
import { type Result, ok, err } from '../result.js';
import { AppError } from '../errors/AppError.js';
import type { AddItemToOrderInput, AddItemToOrderOutput } from '../dtos/AddItemToOrderDTO.js';

export class AddItemToOrderUseCase {
    constructor(
        private readonly orders: OrderRepository,
        private readonly pricing: PricingService,
        private readonly eventBus: EventBus,
        private readonly logger: Logger,
    ) {}

    async execute(input: AddItemToOrderInput): Promise<Result<AddItemToOrderOutput, AppError>> {
        // 1. Construir VOs de entrada — invariantes rotos son ValidationError
        let orderId: OrderId;
        let sku: SKU;
        let qty: Quantity;

        try {
            orderId = OrderId.create(input.orderId);
            sku = SKU.create(input.sku);
            qty = Quantity.create(input.quantity);
        } catch (e) {
            if (e instanceof DomainError) {
                return err(AppError.validation(e.message));
            }
            return err(AppError.infra(e));
        }

        // 2. Cargar el pedido
        let order;
        try {
            order = await this.orders.findById(orderId);
        } catch (e) {
            return err(AppError.infra(e));
        }

        if (order === null) {
            return err(AppError.notFound('Order', orderId.value));
        }

        // 3. Consultar precio — la moneda del pedido determina la divisa del precio
        let unitPrice;
        try {
            unitPrice = await this.pricing.getCurrentPrice(sku, order.currency);
        } catch (e) {
            return err(AppError.infra(e));
        }

        if (unitPrice === null) {
            return err(AppError.notFound('SKU', sku.value));
        }

        // 4. Añadir el item al aggregate
        try {
            order.addItem(sku, qty, unitPrice);
        } catch (e: unknown) {
            if (e instanceof DomainError) {
                return err(AppError.validation(e.message));
            }
            return err(AppError.infra(e));
        }

        // 5. Persistir
        try {
            await this.orders.save(order);
        } catch (e) {
            return err(AppError.infra(e));
        }

        // 6. Publicar eventos
        const events = order.pullDomainEvents();
        try {
            await this.eventBus.publish(events);
        } catch (e) {
            this.logger.error('Failed to publish domain events', { orderId: orderId.value, cause: e });
        }

        const total = order.total();
        this.logger.info('Item added to order', { orderId: orderId.value, sku: sku.value });

        return ok({
            orderId: orderId.value,
            total: { amount: total.amount, currency: total.currency.code },
        });
    }
}
