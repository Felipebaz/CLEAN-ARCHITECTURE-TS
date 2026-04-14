import { describe, it, expect } from 'vitest';
import { Order } from '@domain/entities/Order';
import { Price, CurrencyMismatch } from '@domain/value-objects/Price';

// Stubs mínimos hasta que SKU y Quantity tengan implementación
const sku = (value: string) => ({ value } as any);
const qty = (value: number) => ({ value } as any);

describe('Order', () => {
    describe('constructor', () => {
        it('creates an order with the given id and customerId', () => {
            const order = new Order('order-1', 'customer-1');
            expect(order.id).toBe('order-1');
            expect(order.customerId).toBe('customer-1');
        });
    });

    describe('total', () => {
        it('returns 0 USD when there are no items', () => {
            const order = new Order('order-1', 'customer-1');
            const total = order.total();
            expect(total.amount).toBe(0);
            expect(total.currency).toBe('USD');
        });

        it('returns the sum of all items', () => {
            const order = new Order('order-1', 'customer-1');
            order.addItem(sku('SKU-A'), qty(2), Price.create(10, 'USD')); // 20
            order.addItem(sku('SKU-B'), qty(3), Price.create(5, 'USD'));  // 15
            expect(order.total().amount).toBe(35);
        });

        it('preserves the currency of the items', () => {
            const order = new Order('order-1', 'customer-1');
            order.addItem(sku('SKU-A'), qty(1), Price.create(10, 'EUR'));
            expect(order.total().currency).toBe('EUR');
        });
    });

    describe('addItem', () => {
        it('adds an item to the order', () => {
            const order = new Order('order-1', 'customer-1');
            order.addItem(sku('SKU-A'), qty(1), Price.create(10, 'USD'));
            expect(order.total().amount).toBe(10);
        });

        it('throws CurrencyMismatch when adding items with different currencies', () => {
            const order = new Order('order-1', 'customer-1');
            order.addItem(sku('SKU-A'), qty(1), Price.create(10, 'USD'));
            expect(() =>
                order.addItem(sku('SKU-B'), qty(1), Price.create(5, 'EUR'))
            ).toThrow(CurrencyMismatch);
        });

        it('allows multiple items with the same currency', () => {
            const order = new Order('order-1', 'customer-1');
            order.addItem(sku('SKU-A'), qty(2), Price.create(10, 'USD'));
            order.addItem(sku('SKU-B'), qty(1), Price.create(20, 'USD'));
            expect(order.total().amount).toBe(40);
        });
    });

    describe('pullDomainEvents', () => {
        it('returns an empty list when no events have been recorded', () => {
            const order = new Order('order-1', 'customer-1');
            expect(order.pullDomainEvents()).toEqual([]);
        });

        it('clears events after pulling them', () => {
            const order = new Order('order-1', 'customer-1');
            order.pullDomainEvents();
            expect(order.pullDomainEvents()).toHaveLength(0);
        });
    });
});
