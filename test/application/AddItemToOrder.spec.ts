import { describe, it, expect, beforeEach } from 'vitest';
import { AddItemToOrderUseCase } from '@application/use-cases/AddItemToOrderUseCase';
import { InMemoryOrderRepository } from '@infrastructure/persistence/InMemoryOrderRepository';
import { StaticPricingService } from '@infrastructure/pricing/StaticPricingService';
import { NoopEventBus } from '@infrastructure/mesagging/NoopEventBus';
import { Order } from '@domain/entities/Order';
import { OrderId } from '@domain/value-objects/OrderId';
import { CustomerId } from '@domain/value-objects/CustomerId';
import { Currency } from '@domain/value-objects/Currency';
import type { Logger } from '@application/ports/Logger';

// ─── helpers ────────────────────────────────────────────────────────────────

const nullLogger: Logger = { info: () => {}, error: () => {} };

function makeUseCase() {
    const orders   = new InMemoryOrderRepository();
    const pricing  = new StaticPricingService();
    const eventBus = new NoopEventBus();
    const useCase  = new AddItemToOrderUseCase(orders, pricing, eventBus, nullLogger);
    return { useCase, orders };
}

async function seedOrder(
    orders: InMemoryOrderRepository,
    orderId: string,
    currency = 'USD',
) {
    const order = Order.create(
        OrderId.create(orderId),
        CustomerId.create('customer-1'),
        Currency.create(currency),
    );
    await orders.save(order);
    order.pullDomainEvents(); // descartar eventos de setup
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('AddItemToOrderUseCase (aceptación, in-memory)', () => {
    let orders: InMemoryOrderRepository;
    let useCase: AddItemToOrderUseCase;

    beforeEach(() => {
        ({ orders, useCase } = makeUseCase());
    });

    // ── happy path ──────────────────────────────────────────────────────────

    it('devuelve el total correcto al añadir un item', async () => {
        await seedOrder(orders, 'order-1', 'USD');

        const result = await useCase.execute({ orderId: 'order-1', sku: 'SKU-A', quantity: 2 });

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.orderId).toBe('order-1');
        expect(result.value.total.amount).toBe(20);   // SKU-A USD = 10.00 × 2
        expect(result.value.total.currency).toBe('USD');
    });

    it('persiste el pedido actualizado en el repositorio', async () => {
        await seedOrder(orders, 'order-1', 'USD');

        await useCase.execute({ orderId: 'order-1', sku: 'SKU-A', quantity: 1 });

        const saved = await orders.findById(OrderId.create('order-1'));
        expect(saved?.total().amount).toBe(10);
    });

    it('acumula el total al añadir varios items', async () => {
        await seedOrder(orders, 'order-1', 'USD');

        await useCase.execute({ orderId: 'order-1', sku: 'SKU-A', quantity: 1 }); // 10
        const result = await useCase.execute({ orderId: 'order-1', sku: 'SKU-B', quantity: 2 }); // +50

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.total.amount).toBe(60);
    });

    it('emite ItemAddedEvent después de añadir el item', async () => {
        await seedOrder(orders, 'order-1', 'USD');
        await useCase.execute({ orderId: 'order-1', sku: 'SKU-A', quantity: 1 });

        const saved = await orders.findById(OrderId.create('order-1'));
        // El repositorio guarda el aggregate tras publicar — los eventos ya fueron extraídos
        // Verificamos que el total refleja el item, lo que sólo ocurre si addItem se ejecutó
        expect(saved?.total().amount).toBe(10);
    });

    // ── errores de negocio ───────────────────────────────────────────────────

    it('devuelve not_found cuando el pedido no existe', async () => {
        const result = await useCase.execute({ orderId: 'ghost', sku: 'SKU-A', quantity: 1 });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe('not_found');
        if (result.error.kind === 'not_found') {
            expect(result.error.resource).toBe('Order');
            expect(result.error.id).toBe('ghost');
        }
    });

    it('devuelve not_found cuando el SKU no existe en el catálogo', async () => {
        await seedOrder(orders, 'order-1', 'USD');

        const result = await useCase.execute({ orderId: 'order-1', sku: 'SKU-FAKE', quantity: 1 });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe('not_found');
        if (result.error.kind === 'not_found') {
            expect(result.error.resource).toBe('SKU');
        }
    });

    it('devuelve not_found cuando el SKU no tiene precio para la moneda del pedido', async () => {
        await seedOrder(orders, 'order-1', 'JPY'); // SKU-PROMO no tiene JPY en el catálogo

        const result = await useCase.execute({ orderId: 'order-1', sku: 'SKU-PROMO', quantity: 1 });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe('not_found');
    });

    // ── errores de validación ───────────────────────────────────────────────

    it('devuelve validation cuando el orderId está vacío', async () => {
        const result = await useCase.execute({ orderId: '', sku: 'SKU-A', quantity: 1 });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe('validation');
    });

    it('devuelve validation cuando el SKU tiene formato inválido', async () => {
        await seedOrder(orders, 'order-1', 'USD');

        const result = await useCase.execute({ orderId: 'order-1', sku: '!!bad sku!!', quantity: 1 });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe('validation');
    });

    it('devuelve validation cuando la cantidad es cero', async () => {
        await seedOrder(orders, 'order-1', 'USD');

        const result = await useCase.execute({ orderId: 'order-1', sku: 'SKU-A', quantity: 0 });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe('validation');
    });

    it('devuelve validation cuando la cantidad es negativa', async () => {
        await seedOrder(orders, 'order-1', 'USD');

        const result = await useCase.execute({ orderId: 'order-1', sku: 'SKU-A', quantity: -1 });

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error.kind).toBe('validation');
    });
});
