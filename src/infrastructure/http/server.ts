import Fastify from 'fastify';
import { makeOrdersController } from '@infrastructure/http/controllers/OrdersController';
import type { AddItemToOrderUseCase } from '@application/use-cases/AddItemToOrderUseCase';
import type { CreateOrderUseCase } from '@application/use-cases/CreateOrderUseCase';

interface ServerDeps {
    useCases: {
        addItemToOrder: AddItemToOrderUseCase;
        createOrder: CreateOrderUseCase;
    };
}

export async function buildServer(deps: ServerDeps) {
    const app  = Fastify({ logger: false });
    const ctrl = makeOrdersController(
        deps.useCases.addItemToOrder,
        deps.useCases.createOrder,
    );

    app.post('/orders',                ctrl.create);
    app.post('/orders/:orderId/items', ctrl.addItem);
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    return app;
}
