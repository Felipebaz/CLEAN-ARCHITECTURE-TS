import type { FastifyReply, FastifyRequest } from 'fastify';
import { AddItemToOrderUseCase } from '@application/use-cases/AddItemToOrderUseCase';
import { CreateOrderUseCase } from '@application/use-cases/CreateOrderUseCase';
import { AppError } from '@application/errors/AppError';

interface CreateOrderBody {
    orderId: string;
    customerId: string;
    currency: string;
}

interface AddItemBody {
    sku: string;
    quantity: number;
}

export const makeOrdersController = (
    addItemToOrder: AddItemToOrderUseCase,
    createOrder: CreateOrderUseCase,
) => ({
    create: async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as CreateOrderBody;
        const res = await createOrder.execute({
            orderId: body.orderId,
            customerId: body.customerId,
            currency: body.currency,
        });
        if (!res.ok) {
            const { status, body: resBody } = mapAppErrorToHttp(res.error);
            return reply.code(status).send(resBody);
        }
        return reply.code(201).send(res.value);
    },

    addItem: async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as AddItemBody;
        const res = await addItemToOrder.execute({
            orderId: (req.params as { orderId: string }).orderId,
            sku: body.sku,
            quantity: body.quantity,
        });
        if (!res.ok) {
            const { status, body: resBody } = mapAppErrorToHttp(res.error);
            return reply.code(status).send(resBody);
        }
        return reply.code(200).send(res.value);
    },
});

function mapAppErrorToHttp(error: AppError) {
    switch (error.kind) {
        case 'validation': return { status: 400, body: { message: error.message } };
        case 'not_found':  return { status: 404, body: { message: `${error.resource} '${error.id}' not found` } };
        case 'conflict':   return { status: 409, body: { message: error.message } };
        default:           return { status: 500, body: { message: 'Internal Server Error' } };
    }
}
