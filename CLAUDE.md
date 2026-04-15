# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
npm test

# Run a single test file
npx vitest run test/domain/Price.spec.ts

# Run tests matching a name pattern
npx vitest run -t "pattern"

# Start the dev server
npm run dev
```

No separate build step is needed — `tsx` runs TypeScript directly.

## Architecture

This is a **Clean Architecture** TypeScript microservice for order management. The three layers enforce a strict dependency rule: domain ← application ← infrastructure.

### Domain (`src/domain/`)
Pure business logic with zero external dependencies.
- **Entities**: `Order` is the aggregate root — it accumulates items, enforces invariants, and tracks domain events internally.
- **Value Objects**: `Price` (amount + currency, immutable, supports arithmetic), `Currency` (union type), `SKU`.
- **Errors**: `DomainError`, `InvalidStateError`, `InvalidPriceError` — all extend a base class, never throw raw strings.

### Application (`src/application/`)
Orchestrates use cases; depends only on domain types and port interfaces.
- **Use Cases**: `CreateOrderUseCase`, `AddItemToOrderUseCase`.
- **Ports** (`ports/`): TypeScript interfaces the application layer owns — `OrderRepository`, `PricingService`, `EventBus`, `Logger`, `Clock`. Infrastructure must satisfy these, not the other way around.
- **AppContext**: A single type that aggregates all ports; use cases receive only what they need from it.

### Infrastructure (`src/infrastructure/`)
Concrete implementations of ports.
- **Persistence**: `InMemoryOrderRepository` (default); PostgreSQL adapter exists for production.
- **HTTP**: Fastify server (`server.ts`) + `OrdersController` (POST `/orders`, POST `/orders/:orderId/items`).
- **Messaging**: `OutboxEventBus` implements the outbox pattern for reliable event delivery.
- **Observability**: `PinoLogger` wraps Pino.

### Composition Root (`src/composition/`)
- **`container.ts`** (`buildContainer`): The only place that wires everything together. Selects in-memory vs. PostgreSQL via `USE_IN_MEMORY_DB` env var.
- **`config.ts`**: Zod-validated environment variables (`NODE_ENV`, `DATABASE_URL`, `PRICING_BASE_URL`, `USE_IN_MEMORY_DB`, `PORT`). Fails fast at startup if config is invalid.

### Entry Point (`main.ts`)
Calls `buildContainer`, creates the Fastify server, registers graceful SIGINT/SIGTERM shutdown.

## Path Aliases

Defined in `tsconfig.json` and mirrored in `vitest.config.ts`:

| Alias | Resolves to |
|---|---|
| `@domain` | `src/domain` |
| `@application` | `src/application` |
| `@infrastructure` | `src/infrastructure` |

Use these aliases for cross-layer imports — never use relative paths like `../../domain`.

## Testing

Tests live in `test/` and use Vitest with globals enabled (no need to import `describe`/`it`/`expect`). Domain tests are pure unit tests — no mocking frameworks needed since domain logic has no external dependencies. The test config resolves path aliases identically to the main tsconfig.
