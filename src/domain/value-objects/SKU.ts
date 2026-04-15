import { DomainError } from '../errors/DomainError.js';

export class InvalidSKU extends DomainError {
    constructor(raw: string) {
        super(`Invalid SKU: "${raw}" — must be a non-empty alphanumeric string (A-Z, 0-9, hyphens, underscores)`);
    }
}

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9\-_]*$/;

export class SKU {
    private constructor(readonly value: string) {}

    static create(raw: string): SKU {
        const normalized = raw.trim().toUpperCase();
        if (!SKU_PATTERN.test(normalized)) {
            throw new InvalidSKU(raw);
        }
        return new SKU(normalized);
    }

    equals(other: SKU): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
