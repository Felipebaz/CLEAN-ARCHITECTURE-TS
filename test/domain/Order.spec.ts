import { describe, it, expect } from 'vitest';
import { Order } from '@domain/entities/Order';
import { OrderId } from '@domain/value-objects/OrderId';
import { CustomerId } from '@domain/value-objects/CustomerId';
import { SKU } from '@domain/value-objects/SKU';
import { Quantity } from '@domain/value-objects/Quantity';
import { Price } from '@domain/value-objects/Price';
import { CurrencyMismatch } from '@domain/errors/DomainError';

const id = OrderId.create('order-1');
const customerId = CustomerId.create('customer-1');

describe('Order', () => {
    describe('create', () => {
        it('crea un pedido con id, customerId y moneda', () => {
            const order = Order.create(id, customerId, 'USD');
            expect(order.id.value).toBe('order-1');
            expect(order.customerId.value).toBe('customer-1');
            expect(order.currency).toBe('USD');
        });

        it('registra OrderCreatedEvent al crearse', () => {
            const order = Order.create(id, customerId, 'USD');
            const events = order.pullDomainEvents();
            expect(events).toHaveLength(1);
            expect(events[0]!.eventType).toBe('order.created');
        });
    });

    describe('total', () => {
        it('devuelve 0 en la moneda del pedido cuando no hay items', () => {
            const order = Order.create(id, customerId, 'EUR');
            const total = order.total();
            expect(total.amount).toBe(0);
            expect(total.currency).toBe('EUR');
        });

        it('devuelve la suma de todos los items', () => {
            const order = Order.create(id, customerId, 'USD');
            order.addItem(SKU.create('SKU-A'), Quantity.create(2), Price.create(10, 'USD')); // 20
            order.addItem(SKU.create('SKU-B'), Quantity.create(3), Price.create(5, 'USD'));  // 15
            expect(order.total().amount).toBe(35);
        });

        it('preserva la moneda del pedido', () => {
            const order = Order.create(id, customerId, 'EUR');
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, 'EUR'));
            expect(order.total().currency).toBe('EUR');
        });
    });

    describe('addItem', () => {
        it('añade un item al pedido', () => {
            const order = Order.create(id, customerId, 'USD');
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, 'USD'));
            expect(order.total().amount).toBe(10);
        });

        it('lanza CurrencyMismatch si el precio no coincide con la moneda del pedido', () => {
            const order = Order.create(id, customerId, 'USD');
            expect(() =>
                order.addItem(SKU.create('SKU-B'), Quantity.create(1), Price.create(5, 'EUR'))
            ).toThrow(CurrencyMismatch);
        });

        it('permite múltiples items con la misma moneda', () => {
            const order = Order.create(id, customerId, 'USD');
            order.addItem(SKU.create('SKU-A'), Quantity.create(2), Price.create(10, 'USD'));
            order.addItem(SKU.create('SKU-B'), Quantity.create(1), Price.create(20, 'USD'));
            expect(order.total().amount).toBe(40);
        });

        it('registra ItemAddedEvent al añadir un item', () => {
            const order = Order.create(id, customerId, 'USD');
            order.pullDomainEvents(); // limpiar OrderCreatedEvent
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, 'USD'));
            const events = order.pullDomainEvents();
            expect(events).toHaveLength(1);
            expect(events[0]!.eventType).toBe('order.item_added');
        });
    });

    describe('pullDomainEvents', () => {
        it('vacía los eventos tras el pull', () => {
            const order = Order.create(id, customerId, 'USD');
            order.pullDomainEvents();
            expect(order.pullDomainEvents()).toHaveLength(0);
        });

        it('acumula OrderCreatedEvent + ItemAddedEvents en orden', () => {
            const order = Order.create(id, customerId, 'USD');
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, 'USD'));
            const events = order.pullDomainEvents();
            expect(events).toHaveLength(2);
            expect(events[0]!.eventType).toBe('order.created');
            expect(events[1]!.eventType).toBe('order.item_added');
        });
    });
});
