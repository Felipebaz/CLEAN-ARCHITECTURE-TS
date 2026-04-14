export class Price {
    private constructor (readonly amount: number, readonly currency: "EUR" | "USD" | "UYU") {}

    static create(amount: number, currency: "EUR" | "USD" | "UYU"){
            if(!Number.isFinite(amount) || amount < 0){
                throw new Error("Amount must be a positive number");
            }
            const roundedAmount = Math.round(amount * 100) / 100;
            return new Price(roundedAmount, currency);
        }
    }