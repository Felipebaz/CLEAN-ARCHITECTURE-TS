import { Price } from '../value-objects/Price.js';
import { SKU } from '../value-objects/SKU.js';
import { Quantity } from '../value-objects/Quantity.js';
import { OrderId } from '../value-objects/OrderId.js';
import { CustomerId } from '../value-objects/CustomerId.js';
import { Currency } from '../value-objects/Currency.js';
import { CurrencyMismatch } from '../errors/DomainError.js';
import type { DomainEvent } from '../events/DomainEvent.js';
import { OrderCreatedEvent } from '../events/OrderCreatedEvent.js';
import { ItemAddedEvent } from '../events/ItemAddedEvent.js';

type OrderItem = Readonly<{
    sku: SKU;
    qty: Quantity;
    unit: Price;
}>;

export class Order {
    private readonly items: OrderItem[] = [];
    private domainEvents: DomainEvent[] = [];

    private constructor(
        readonly id: OrderId,
        readonly customerId: CustomerId,
        readonly currency: Currency,
    ) {}

    /**
     * Crea un nuevo pedido y registra OrderCreatedEvent.
     * Único punto de entrada para pedidos nuevos.
     */
    static create(id: OrderId, customerId: CustomerId, currency: Currency): Order {
        const order = new Order(id, customerId, currency);
        order.record(new OrderCreatedEvent(id, customerId, currency));
        return order;
    }

    /**
     * Reconstituye un pedido desde persistencia sin emitir eventos.
     */
    static reconstitute(
        id: OrderId,
        customerId: CustomerId,
        currency: Currency,
        items: ReadonlyArray<OrderItem>,
    ): Order {
        const order = new Order(id, customerId, currency);
        order.items.push(...items);
        return order;
    }

    addItem(sku: SKU, qty: Quantity, unit: Price): void {
        if (!this.currency.equals(unit.currency)) {
            throw new CurrencyMismatch(this.currency.code, unit.currency.code);
        }
        this.items.push(Object.freeze({ sku, qty, unit }));
        this.record(new ItemAddedEvent(this.id, sku, qty, unit));
    }

    total(): Price {
        return this.items.reduce(
            (acc, item) => acc.add(item.unit.multiply(item.qty.value)),
            Price.create(0, this.currency),
        );
    }

    /** Solo para uso del repositorio — snapshot de los items actuales. */
    getItems(): ReadonlyArray<{ sku: SKU; qty: Quantity; unit: Price }> {
        return [...this.items];
    }

    pullDomainEvents(): DomainEvent[] {
        const events = [...this.domainEvents];
        this.domainEvents = [];
        return events;
    }

    private record(event: DomainEvent): void {
        this.domainEvents.push(event);
    }
}
