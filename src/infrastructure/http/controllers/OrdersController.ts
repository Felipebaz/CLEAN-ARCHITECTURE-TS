import { FastifyReply, FastifyRequest } from 'fastify';
import { AddItemToOrder } from "@application/use-cases/AddItemToOrder";
import { AppError } from "@application/errors";
import { Order } from '@domain/entities/Order';

export const makeOrdersController = (uc: AddItemToOrder) => ({
    addItem: async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as any;
        const res = await uc.Execute({
            OrderId: req.params["orderId"] as string,
            sku: body.sku,
            quantity: body.quantity,
            currency: body.currency
        })
        if(!res.ok){
            const {status, body} =  mapAppErrorToHttp(res.error);
            return reply.code(status).send(body);
        }
        return reply.code(200).send(res.value);
    },
});

function mapAppErrorToHttp(error: AppError) {
    switch (error.type){
        case "validation error": return {status: 400, body: {message: error.message}};
        case "not found": return {status: 404, body: {message: error.message}};
        case "conflict": return {status: 409, body: {message: error.message}};
        default: return {status: 500, body: {message: "Internal Server Error"}};
    }
}
