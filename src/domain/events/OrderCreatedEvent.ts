import type { DomainEvent } from './DomainEvent.js';
import type { OrderId } from '../value-objects/OrderId.js';
import type { CustomerId } from '../value-objects/CustomerId.js';
import type { Currency } from '../value-objects/Currency.js';

export class OrderCreatedEvent implements DomainEvent {
    readonly eventType = 'order.created' as const;
    readonly occurredAt = new Date();

    constructor(
        readonly orderId: OrderId,
        readonly customerId: CustomerId,
        readonly currency: Currency,
    ) {}

    get aggregateId(): string {
        return this.orderId.value;
    }
}
