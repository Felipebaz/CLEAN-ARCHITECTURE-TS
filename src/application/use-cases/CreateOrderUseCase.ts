import { Order } from '@domain/entities/Order';
import type { OrderRepository } from '@application/ports/OrderRepository';

export type CreateOrderInput = { orderId: string; customerId:string;}
export type CreateOrderOutput = { orderId: string;}

export class CreateOrderUseCase {
    constructor(private readonly orderRepository: OrderRepository) {}

    async execute({orderId, customerId}: CreateOrderInput): Promise<CreateOrderOutput> {
        const exists = await this.orderRepository.findById(orderId);
        if (exists) {
            throw new Error("Order already exists");
        }
        const order = new Order(orderId, customerId);
        await this.orderRepository.save(order);
        return { orderId: order.id };
    }
}