import { InvalidQuantity } from '../errors/DomainError.js';

export class Quantity {
    private constructor(readonly value: number) {}

    static create(value: number): Quantity {
        if (!Number.isInteger(value) || value <= 0) {
            throw new InvalidQuantity(value);
        }
        return new Quantity(value);
    }

    add(other: Quantity): Quantity {
        return Quantity.create(this.value + other.value);
    }

    equals(other: Quantity): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return String(this.value);
    }
}
