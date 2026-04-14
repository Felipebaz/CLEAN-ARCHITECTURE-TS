export class DomainError extends Error {}
export class InvalidStateError extends DomainError {}

export class InvalidPriceError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidPriceError";
    }
}
