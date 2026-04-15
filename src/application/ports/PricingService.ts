import type { SKU } from '@domain/value-objects/SKU';
import type { Price } from '@domain/value-objects/Price';
import type { Currency } from '@domain/value-objects/Currency';

export interface PricingService {
    getCurrentPrice(sku: SKU, currency: Currency): Promise<Price | null>;
}
