CREATE TABLE IF NOT EXISTS orders (
    id          TEXT        PRIMARY KEY,
    customer_id TEXT        NOT NULL,
    currency    CHAR(3)     NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
