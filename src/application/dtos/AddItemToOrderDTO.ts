/** Entrada y salida del caso de uso AddItemToOrder. Primitivos puros, sin VOs. */

export type AddItemToOrderInput = {
    readonly orderId: string;
    readonly sku: string;
    readonly quantity: number;
};

export type AddItemToOrderOutput = {
    readonly orderId: string;
    readonly total: {
        readonly amount: number;
        readonly currency: string;
    };
};
