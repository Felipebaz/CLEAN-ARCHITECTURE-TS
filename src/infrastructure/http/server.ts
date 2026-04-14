import Fastify from 'fastify';
import { OrderController } from './OrdersController';

export async function buildServer() {
    const app = Fastify();
    app.post("/orders", OrderController.create);
    app.delete("/orders", OrderController.delete);
    app.delete("/orders/:id", OrderController.delete);
    return app;
}