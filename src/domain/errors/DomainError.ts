export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class InvalidStateError extends DomainError {}

/** Lanzado cuando se mezclan monedas incompatibles en una operación de precio. */
export class CurrencyMismatch extends DomainError {
    constructor(expected: string, actual: string) {
        super(`Currency mismatch: expected ${expected}, got ${actual}`);
    }
}

/** Lanzado cuando una cantidad no es un entero positivo mayor que cero. */
export class InvalidQuantity extends DomainError {
    constructor(qty: number) {
        super(`Invalid quantity: ${qty} — must be a positive integer greater than zero`);
    }
}
