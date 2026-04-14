import type { Currency } from "./Currency.ts";

export class CurrencyMismatch extends Error {
    constructor(expected: Currency, actual: Currency) {
        super(`Currency mismatch: expected ${expected}, got ${actual}`);
        Object.setPrototypeOf(this, CurrencyMismatch.prototype);
    }
}

export class InvalidQuantity extends Error {
    constructor(qty: number) {
        super(`Invalid quantity: ${qty}`);
        Object.setPrototypeOf(this, InvalidQuantity.prototype);
    }
}

export class Price {
    private constructor (readonly amount: number, readonly currency: Currency) {}

    static create(amount: number, currency: Currency){
        if(!Number.isFinite(amount) || amount < 0){
            throw new Error("Amount must be a positive number");
        }
        const roundedAmount = Math.round(amount * 100) / 100;
        return new Price(roundedAmount, currency);
    }
    add(other: Price){
        if(this.currency !== other.currency){
            throw new CurrencyMismatch(this.currency, other.currency);
        }
        return Price.create(this.amount + other.amount, this.currency);
    }

    multiply(qty: number){
        if(!Number.isInteger(qty) || qty < 0){
            throw new InvalidQuantity(qty);
        }
        return Price.create(this.amount * qty, this.currency);
    }

    equals(other: Price){
        return this.amount === other.amount && this.currency === other.currency;
    }
}