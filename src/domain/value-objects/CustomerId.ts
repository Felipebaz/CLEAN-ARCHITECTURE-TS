import { DomainError } from '../errors/DomainError.js';

export class InvalidCustomerId extends DomainError {
    constructor(raw: string) {
        super(`Invalid CustomerId: "${raw}" — must be a non-empty string`);
    }
}

export class CustomerId {
    private constructor(readonly value: string) {}

    static create(raw: string): CustomerId {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
            throw new InvalidCustomerId(raw);
        }
        return new CustomerId(trimmed);
    }

    equals(other: CustomerId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
