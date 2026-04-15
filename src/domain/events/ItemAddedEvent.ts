import type { DomainEvent } from './DomainEvent.js';
import type { OrderId } from '../value-objects/OrderId.js';
import type { SKU } from '../value-objects/SKU.js';
import type { Quantity } from '../value-objects/Quantity.js';
import type { Price } from '../value-objects/Price.js';

export class ItemAddedEvent implements DomainEvent {
    readonly eventType = 'order.item_added' as const;
    readonly occurredAt = new Date();

    constructor(
        readonly orderId: OrderId,
        readonly sku: SKU,
        readonly qty: Quantity,
        readonly unit: Price,
    ) {}

    get aggregateId(): string {
        return this.orderId.value;
    }
}
