import { Order } from '@domain/entities/Order';
import type { OrderId } from '@domain/value-objects/OrderId';
import type { OrderRepository } from '@application/ports/OrderRepository';

export class InMemoryOrderRepository implements OrderRepository {
    private readonly store = new Map<string, Order>();

    async findById(id: OrderId): Promise<Order | null> { return this.store.get(id.value) ?? null; }
    async save(order: Order): Promise<void>            { this.store.set(order.id.value, order); }
    async delete(id: OrderId): Promise<void>           { this.store.delete(id.value); }
}