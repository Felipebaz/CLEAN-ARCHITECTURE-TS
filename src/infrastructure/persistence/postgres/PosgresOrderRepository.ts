import type { QueryResult, QueryResultRow } from 'pg';
import type { OrderRepository } from '@application/ports/OrderRepository';
import { Order } from '@domain/entities/Order';
import { OrderId } from '@domain/value-objects/OrderId';
import { CustomerId } from '@domain/value-objects/CustomerId';
import { Currency } from '@domain/value-objects/Currency';
import { SKU } from '@domain/value-objects/SKU';
import { Quantity } from '@domain/value-objects/Quantity';
import { Price } from '@domain/value-objects/Price';

// ─── queryable ───────────────────────────────────────────────────────────────

/** Mínimo común de Pool y PoolClient — permite inyectar cualquiera de los dos. */
export type Queryable = {
    query<R extends QueryResultRow = QueryResultRow>(
        text: string,
        values?: unknown[],
    ): Promise<QueryResult<R>>;
};

// ─── row shapes ──────────────────────────────────────────────────────────────

type OrderRow = {
    id:            string;
    customer_id:   string;
    currency:      string;
    sku:           string | null;   // null cuando el pedido no tiene items (LEFT JOIN)
    quantity:      string | null;   // pg devuelve INTEGER como string
    unit_amount:   string | null;   // pg devuelve NUMERIC como string
    item_currency: string | null;
};

// ─── repository ──────────────────────────────────────────────────────────────

/**
 * Repositorio sin gestión de transacciones — solo ejecuta queries sobre el
 * Queryable que recibe. La transacción la gestiona el llamador (Pool directo
 * para lecturas / UoW para escrituras atómicas).
 */
export class PostgresOrderRepository implements OrderRepository {
    constructor(private readonly db: Queryable) {}

    // ── findById ─────────────────────────────────────────────────────────────

    async findById(id: OrderId): Promise<Order | null> {
        const { rows } = await this.db.query<OrderRow>(
            `SELECT
                o.id,
                o.customer_id,
                o.currency,
                oi.sku,
                oi.quantity::text,
                oi.unit_amount::text,
                oi.currency AS item_currency
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.id = $1
             ORDER BY oi.id`,
            [id.value],
        );

        if (rows.length === 0) return null;

        const first = rows[0]!;

        const items = rows
            .filter((r): r is OrderRow & { sku: string } => r.sku !== null)
            .map(r => ({
                sku:  SKU.create(r.sku),
                qty:  Quantity.create(Number(r.quantity)),
                unit: Price.create(Number(r.unit_amount), Currency.create(r.item_currency!)),
            }));

        return Order.reconstitute(
            OrderId.create(first.id),
            CustomerId.create(first.customer_id),
            Currency.create(first.currency),
            items,
        );
    }

    // ── save ─────────────────────────────────────────────────────────────────

    async save(order: Order): Promise<void> {
        await this.db.query(
            `INSERT INTO orders (id, customer_id, currency)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE
                SET customer_id = EXCLUDED.customer_id,
                    currency    = EXCLUDED.currency`,
            [order.id.value, order.customerId.value, order.currency.code],
        );

        await this.db.query(
            'DELETE FROM order_items WHERE order_id = $1',
            [order.id.value],
        );

        for (const item of order.getItems()) {
            await this.db.query(
                `INSERT INTO order_items (order_id, sku, quantity, unit_amount, currency)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    order.id.value,
                    item.sku.value,
                    item.qty.value,
                    item.unit.amount,
                    item.unit.currency.code,
                ],
            );
        }
    }

    // ── delete ────────────────────────────────────────────────────────────────

    async delete(id: OrderId): Promise<void> {
        await this.db.query('DELETE FROM order_items WHERE order_id = $1', [id.value]);
        await this.db.query('DELETE FROM orders WHERE id = $1', [id.value]);
    }
}
