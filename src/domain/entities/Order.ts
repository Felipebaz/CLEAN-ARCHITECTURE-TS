import { Price } from '@domain/value-objects/Price';
import { SKU } from '@domain/value-objects/SKU';
import { Quantity } from '@domain/value-objects/Quantity';

type OrderItem = Readonly<{
    sku: SKU;
    qty: Quantity;
    unit: Price;
}>;

export class Order {
    private readonly items: OrderItem[] = [];
    private readonly domainEvents: DomainEvent[] = [];

    constructor(readonly id: OrderId, readonly customerId: CustomerId) {}

    static create (id: OrderId, customerId: CustomerId) {
        const order = new Order(id, customerId);
        order.record(new OrderCreatedEvent({orderId: id, customerId}));
        return order;
    }   

    addItem(sku: SKU, qty: Quantity, unit: Price) {
        if (this.items.length > 0){
            const currency = this.items[0].unit.currency;
            if (unit.currency !== currency) {
                throw new CurrencyMismatch();
            }   
        }
        this.items.push(Object.freeze({sku, qty, unit}));
        this.record(new ItemAdded({OrderId: this.id, sku: sku.value, qty: qty.value, unit: unit.amount, currency: unit.currency}));
    }

    total(): Price {
        if (this.items.length === 0) {
            return Price.create(0, "USD");
        }
        const currency = this.items[0].unit.currency;
        return this.items.reduce((acc, i) => acc.add(i.unit.multiply(i.qty.value)), 
            Price.create(0, currency));
    }

    pullDomainEvents(): DomainEvent[] {
        const events = [...this.domainEvents];
        (this as any).domainEvents = [];
        return events;
    }

    private record (e: DomainEvent) {this.domainEvents.push(e);}
}