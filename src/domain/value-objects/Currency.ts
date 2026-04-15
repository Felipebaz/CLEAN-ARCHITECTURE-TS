
export class Currency {
    private static readonly VALID_CURRENCIES: ("USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD" | "UYU")[] = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "UYU"];
private readonly _code: string
    private constructor(code: string) {
        if(!code || !Currency.VALID_CURRENCIES.includes(code.toUpperCase() as any)) {
            throw new Error(`Invalid currency: ${code}. Valid currencies are: ${Currency.VALID_CURRENCIES.join(", ")}`);
        }
        this._code = code.toUpperCase();
    }

    get code(): string {
        return this._code;
    }
}
