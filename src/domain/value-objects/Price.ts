import type { Currency } from './Currency.js';
import { CurrencyMismatch, InvalidQuantity } from '../errors/DomainError.js';

// Re-exportados para que los tests que importan desde este módulo no rompan
export { CurrencyMismatch, InvalidQuantity };

export class Price {
    private constructor(readonly amount: number, readonly currency: Currency) {}

    static create(amount: number, currency: Currency): Price {
        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error('Amount must be a positive number');
        }
        return new Price(Math.round(amount * 100) / 100, currency);
    }

    add(other: Price): Price {
        if (this.currency !== other.currency) {
            throw new CurrencyMismatch(this.currency, other.currency);
        }
        return Price.create(this.amount + other.amount, this.currency);
    }

    /** qty debe ser un entero positivo. Si se pasa un Quantity VO, usar qty.value. */
    multiply(qty: number): Price {
        if (!Number.isInteger(qty) || qty < 0) {
            throw new InvalidQuantity(qty);
        }
        return Price.create(this.amount * qty, this.currency);
    }

    equals(other: Price): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }
}
