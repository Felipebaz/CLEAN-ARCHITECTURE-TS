import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';
import { CreateOrderUseCase } from '@application/use-cases/CreateOrderUseCase';

const repo = new InMemoryOrderRepository();
export const createOrder = new CreateOrderUseCase(repo);