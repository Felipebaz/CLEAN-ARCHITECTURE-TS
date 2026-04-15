import { describe, it, expect } from 'vitest';
import { Price, CurrencyMismatch, InvalidQuantity } from '@domain/value-objects/Price';
import { Currency } from '@domain/value-objects/Currency';

const usd = Currency.create('USD');
const eur = Currency.create('EUR');

describe('Price', () => {
    describe('create', () => {
        it('creates a price with valid amount and currency', () => {
            const price = Price.create(10, usd);
            expect(price.amount).toBe(10);
            expect(price.currency.code).toBe('USD');
        });

        it('rounds to 2 decimal places', () => {
            const price = Price.create(10.999, eur);
            expect(price.amount).toBe(11);
        });

        it('allows zero amount', () => {
            const price = Price.create(0, usd);
            expect(price.amount).toBe(0);
        });

        it('throws if amount is negative', () => {
            expect(() => Price.create(-1, usd)).toThrow('Amount must be a positive number');
        });

        it('throws if amount is NaN', () => {
            expect(() => Price.create(NaN, usd)).toThrow('Amount must be a positive number');
        });

        it('throws if amount is Infinity', () => {
            expect(() => Price.create(Infinity, usd)).toThrow('Amount must be a positive number');
        });
    });

    describe('add', () => {
        it('adds two prices with the same currency', () => {
            expect(Price.create(10, usd).add(Price.create(5, usd)).amount).toBe(15);
        });

        it('preserves currency after addition', () => {
            expect(Price.create(10, eur).add(Price.create(5, eur)).currency.code).toBe('EUR');
        });

        it('throws CurrencyMismatch when adding different currencies', () => {
            expect(() => Price.create(10, usd).add(Price.create(5, eur))).toThrow(CurrencyMismatch);
        });
    });

    describe('multiply', () => {
        it('multiplies price by a positive integer', () => {
            expect(Price.create(5, usd).multiply(3).amount).toBe(15);
        });

        it('multiplies price by zero', () => {
            expect(Price.create(5, usd).multiply(0).amount).toBe(0);
        });

        it('preserves currency after multiplication', () => {
            expect(Price.create(5, eur).multiply(2).currency.code).toBe('EUR');
        });

        it('throws InvalidQuantity for a negative quantity', () => {
            expect(() => Price.create(5, usd).multiply(-1)).toThrow(InvalidQuantity);
        });

        it('throws InvalidQuantity for a decimal quantity', () => {
            expect(() => Price.create(5, usd).multiply(1.5)).toThrow(InvalidQuantity);
        });
    });

    describe('equals', () => {
        it('returns true for same amount and currency', () => {
            expect(Price.create(10, usd).equals(Price.create(10, usd))).toBe(true);
        });

        it('returns false for different amount', () => {
            expect(Price.create(10, usd).equals(Price.create(20, usd))).toBe(false);
        });

        it('returns false for different currency', () => {
            expect(Price.create(10, usd).equals(Price.create(10, eur))).toBe(false);
        });
    });
});
