import { describe, it, expect } from 'vitest';
import { Price, CurrencyMismatch, InvalidQuantity } from '@domain/value-objects/Price';

describe('Price', () => {
    describe('create', () => {
        it('creates a price with valid amount and currency', () => {
            const price = Price.create(10, 'USD');
            expect(price.amount).toBe(10);
            expect(price.currency).toBe('USD');
        });

        it('rounds to 2 decimal places', () => {
            const price = Price.create(10.999, 'EUR');
            expect(price.amount).toBe(11);
        });

        it('allows zero amount', () => {
            const price = Price.create(0, 'USD');
            expect(price.amount).toBe(0);
        });

        it('throws if amount is negative', () => {
            expect(() => Price.create(-1, 'USD')).toThrow('Amount must be a positive number');
        });

        it('throws if amount is NaN', () => {
            expect(() => Price.create(NaN, 'USD')).toThrow('Amount must be a positive number');
        });

        it('throws if amount is Infinity', () => {
            expect(() => Price.create(Infinity, 'USD')).toThrow('Amount must be a positive number');
        });
    });

    describe('add', () => {
        it('adds two prices with the same currency', () => {
            const a = Price.create(10, 'USD');
            const b = Price.create(5, 'USD');
            expect(a.add(b).amount).toBe(15);
        });

        it('preserves currency after addition', () => {
            const a = Price.create(10, 'EUR');
            const b = Price.create(5, 'EUR');
            expect(a.add(b).currency).toBe('EUR');
        });

        it('throws CurrencyMismatch when adding different currencies', () => {
            const usd = Price.create(10, 'USD');
            const eur = Price.create(5, 'EUR');
            expect(() => usd.add(eur)).toThrow(CurrencyMismatch);
        });
    });

    describe('multiply', () => {
        it('multiplies price by a positive integer', () => {
            const price = Price.create(5, 'USD');
            expect(price.multiply(3).amount).toBe(15);
        });

        it('multiplies price by zero', () => {
            const price = Price.create(5, 'USD');
            expect(price.multiply(0).amount).toBe(0);
        });

        it('preserves currency after multiplication', () => {
            const price = Price.create(5, 'EUR');
            expect(price.multiply(2).currency).toBe('EUR');
        });

        it('throws InvalidQuantity for a negative quantity', () => {
            const price = Price.create(5, 'USD');
            expect(() => price.multiply(-1)).toThrow(InvalidQuantity);
        });

        it('throws InvalidQuantity for a decimal quantity', () => {
            const price = Price.create(5, 'USD');
            expect(() => price.multiply(1.5)).toThrow(InvalidQuantity);
        });
    });

    describe('equals', () => {
        it('returns true for same amount and currency', () => {
            const a = Price.create(10, 'USD');
            const b = Price.create(10, 'USD');
            expect(a.equals(b)).toBe(true);
        });

        it('returns false for different amount', () => {
            const a = Price.create(10, 'USD');
            const b = Price.create(20, 'USD');
            expect(a.equals(b)).toBe(false);
        });

        it('returns false for different currency', () => {
            const a = Price.create(10, 'USD');
            const b = Price.create(10, 'EUR');
            expect(a.equals(b)).toBe(false);
        });
    });
});
