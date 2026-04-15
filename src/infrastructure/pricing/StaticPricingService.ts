import { Price } from '@domain/value-objects/Price';
import type { SKU } from '@domain/value-objects/SKU';
import type { Currency } from '@domain/value-objects/Currency';
import type { PricingService } from '@application/ports/PricingService';

/**
 * Implementación estática del PricingService para desarrollo y tests de integración.
 * Simula un servicio externo de precios con un catálogo fijo en memoria.
 * No hace IO: sustituir por un adaptador HTTP en producción.
 */

/** Catálogo: SKU → moneda → precio unitario */
type Catalog = Record<string, Partial<Record<string, number>>>;

const DEFAULT_CATALOG: Catalog = {
    'SKU-A':     { USD: 10.00, EUR:  9.20, GBP:  7.80, JPY: 1480, CAD: 13.50, AUD: 15.00, UYU:  390 },
    'SKU-B':     { USD: 25.00, EUR: 23.00, GBP: 19.50, JPY: 3700, CAD: 34.00, AUD: 37.50, UYU:  975 },
    'SKU-C':     { USD:  5.00, EUR:  4.60, GBP:  3.90, JPY:  740, CAD:  6.80, AUD:  7.50, UYU:  195 },
    'SKU-PROMO': { USD:  1.00, EUR:  0.92, GBP:  0.78 },
};

export class StaticPricingService implements PricingService {
    private readonly catalog: Catalog;

    constructor(catalog: Catalog = DEFAULT_CATALOG) {
        this.catalog = catalog;
    }

    async getCurrentPrice(sku: SKU, currency: Currency): Promise<Price | null> {
        const prices = this.catalog[sku.value];
        if (prices === undefined) {
            return null; // SKU desconocido
        }

        const amount = prices[currency.code];
        if (amount === undefined) {
            return null; // moneda no soportada para este SKU
        }

        return Price.create(amount, currency);
    }
}
