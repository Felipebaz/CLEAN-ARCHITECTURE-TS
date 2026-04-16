CREATE TABLE IF NOT EXISTS order_items (
    id          BIGSERIAL       PRIMARY KEY,
    order_id    TEXT            NOT NULL REFERENCES orders(id),
    sku         TEXT            NOT NULL,
    quantity    INTEGER         NOT NULL CHECK (quantity > 0),
    unit_amount NUMERIC(14, 2)  NOT NULL CHECK (unit_amount >= 0),
    currency    CHAR(3)         NOT NULL,
    added_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
