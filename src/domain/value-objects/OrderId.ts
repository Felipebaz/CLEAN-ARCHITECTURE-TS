import { DomainError } from '../errors/DomainError.js';

export class InvalidOrderId extends DomainError {
    constructor(raw: string) {
        super(`Invalid OrderId: "${raw}" — must be a non-empty string`);
    }
}

export class OrderId {
    private constructor(readonly value: string) {}

    static create(raw: string): OrderId {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
            throw new InvalidOrderId(raw);
        }
        return new OrderId(trimmed);
    }

    equals(other: OrderId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
