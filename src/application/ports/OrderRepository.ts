import type { Order } from '@domain/entities/Order';
import type { OrderId } from '@domain/value-objects/OrderId';

export interface OrderRepository {
    findById(id: OrderId): Promise<Order | null>;
    save(order: Order): Promise<void>;
    delete(id: OrderId): Promise<void>;
}
