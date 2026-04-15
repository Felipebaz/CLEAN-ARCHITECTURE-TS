import { createOrder } from '@compostition/containers';
import Fastify from 'fastify';
import { makeOrdersController } from './controllers/OrdersController';
import type { AppContainer } from '@compostition/container';


export async function buildServer(c: AppContainer) {
    const app = Fastify();
    const ctrl = makeOrdersController(c.useCases.addItemToOrder, c.useCases.createOrder);

    app.post("/orders", ctrl.create);
    app.post("/orders/:orderId/items", ctrl.addItem);
    return app;
}