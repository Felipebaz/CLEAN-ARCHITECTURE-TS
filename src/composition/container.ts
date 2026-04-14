import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';
import { CreateOrder } from '@application/usecases/CreateOrderUseCase';

const repo = new InMemoryOrderRepository();
export const createOrder = new CreateOrder(repo);