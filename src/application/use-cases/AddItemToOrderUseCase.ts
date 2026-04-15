import { AddItemToOrder } from '@application/use-cases/AddItemToOrder';
export function AddItemToOrder(ctx: AppContext) {
    return async function execute(input: AddItemToOrderInput): Promise<Result<AddItemToOrderOutput, AppError>> {
        const order = await ctx.orders.findById(input.orderId);
        if (!order) throw new Error("Order not found");

        const price = await ctx.pricing.getPrice(input.productId);
        if (price === null) throw new Error("Product not found");

        order.addItem(input.productId, input.quantity, price);
        await ctx.orders.save(order);

        ctx.eventBus.publish({type: "OrderUpdated", payload: {orderId: input.orderId}});
    }
}
