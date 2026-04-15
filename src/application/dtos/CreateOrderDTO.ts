/** Entrada y salida del caso de uso CreateOrder. Primitivos puros, sin VOs. */

export type CreateOrderInput = {
    readonly orderId: string;
    readonly customerId: string;
    /** Código ISO de moneda. Ej: "USD", "EUR". Validado en el caso de uso. */
    readonly currency: string;
};

export type CreateOrderOutput = {
    readonly orderId: string;
};
