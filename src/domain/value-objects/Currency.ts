import { DomainError } from '../errors/DomainError.js';

export class InvalidCurrency extends DomainError {
    constructor(code: string) {
        super(`Invalid currency: "${code}". Valid currencies are: USD, EUR, GBP, JPY, CAD, AUD, UYU`);
    }
}

const VALID_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'UYU'] as const;

export type CurrencyCode = typeof VALID_CODES[number];

export class Currency {
    private constructor(private readonly _code: CurrencyCode) {}

    static create(raw: string): Currency {
        const upper = raw.trim().toUpperCase() as CurrencyCode;
        if (!(VALID_CODES as readonly string[]).includes(upper)) {
            throw new InvalidCurrency(raw);
        }
        return new Currency(upper);
    }

    get code(): CurrencyCode {
        return this._code;
    }

    equals(other: Currency): boolean {
        return this._code === other._code;
    }

    toString(): string {
        return this._code;
    }
}
