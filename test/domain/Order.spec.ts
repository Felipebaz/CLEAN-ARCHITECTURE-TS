import { describe, it, expect } from 'vitest';
import { Order } from '@domain/entities/Order';
import { OrderId } from '@domain/value-objects/OrderId';
import { CustomerId } from '@domain/value-objects/CustomerId';
import { Currency } from '@domain/value-objects/Currency';
import { SKU } from '@domain/value-objects/SKU';
import { Quantity } from '@domain/value-objects/Quantity';
import { Price } from '@domain/value-objects/Price';
import { CurrencyMismatch } from '@domain/errors/DomainError';

const id = OrderId.create('order-1');
const customerId = CustomerId.create('customer-1');
const usd = Currency.create('USD');
const eur = Currency.create('EUR');

describe('Order', () => {
    describe('create', () => {
        it('crea un pedido con id, customerId y moneda', () => {
            const order = Order.create(id, customerId, usd);
            expect(order.id.value).toBe('order-1');
            expect(order.customerId.value).toBe('customer-1');
            expect(order.currency.code).toBe('USD');
        });

        it('registra OrderCreatedEvent al crearse', () => {
            const order = Order.create(id, customerId, usd);
            const events = order.pullDomainEvents();
            expect(events).toHaveLength(1);
            expect(events[0]!.eventType).toBe('order.created');
        });
    });

    describe('total', () => {
        it('devuelve 0 en la moneda del pedido cuando no hay items', () => {
            const order = Order.create(id, customerId, eur);
            const total = order.total();
            expect(total.amount).toBe(0);
            expect(total.currency.code).toBe('EUR');
        });

        it('devuelve la suma de todos los items', () => {
            const order = Order.create(id, customerId, usd);
            order.addItem(SKU.create('SKU-A'), Quantity.create(2), Price.create(10, usd)); // 20
            order.addItem(SKU.create('SKU-B'), Quantity.create(3), Price.create(5, usd));  // 15
            expect(order.total().amount).toBe(35);
        });

        it('preserva la moneda del pedido', () => {
            const order = Order.create(id, customerId, eur);
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, eur));
            expect(order.total().currency.code).toBe('EUR');
        });
    });

    describe('addItem', () => {
        it('añade un item al pedido', () => {
            const order = Order.create(id, customerId, usd);
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, usd));
            expect(order.total().amount).toBe(10);
        });

        it('lanza CurrencyMismatch si el precio no coincide con la moneda del pedido', () => {
            const order = Order.create(id, customerId, usd);
            expect(() =>
                order.addItem(SKU.create('SKU-B'), Quantity.create(1), Price.create(5, eur))
            ).toThrow(CurrencyMismatch);
        });

        it('permite múltiples items con la misma moneda', () => {
            const order = Order.create(id, customerId, usd);
            order.addItem(SKU.create('SKU-A'), Quantity.create(2), Price.create(10, usd));
            order.addItem(SKU.create('SKU-B'), Quantity.create(1), Price.create(20, usd));
            expect(order.total().amount).toBe(40);
        });

        it('registra ItemAddedEvent al añadir un item', () => {
            const order = Order.create(id, customerId, usd);
            order.pullDomainEvents(); // limpiar OrderCreatedEvent
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, usd));
            const events = order.pullDomainEvents();
            expect(events).toHaveLength(1);
            expect(events[0]!.eventType).toBe('order.item_added');
        });
    });

    describe('pullDomainEvents', () => {
        it('vacía los eventos tras el pull', () => {
            const order = Order.create(id, customerId, usd);
            order.pullDomainEvents();
            expect(order.pullDomainEvents()).toHaveLength(0);
        });

        it('acumula OrderCreatedEvent + ItemAddedEvents en orden', () => {
            const order = Order.create(id, customerId, usd);
            order.addItem(SKU.create('SKU-A'), Quantity.create(1), Price.create(10, usd));
            const events = order.pullDomainEvents();
            expect(events).toHaveLength(2);
            expect(events[0]!.eventType).toBe('order.created');
            expect(events[1]!.eventType).toBe('order.item_added');
        });
    });
});
