import pg from 'pg';
import type { Config } from '@composition/config';

/**
 * Crea y devuelve un Pool de Postgres a partir del config validado.
 * Lanza si DATABASE_URL no está definida (no debería ocurrir si el schema
 * Zod lo exige cuando USE_IN_MEMORY=false, pero falla rápido con mensaje claro).
 */
export function buildPool(config: Config): pg.Pool {
    if (!config.DATABASE_URL) {
        throw new Error(
            '[database] DATABASE_URL es requerida cuando USE_IN_MEMORY=false',
        );
    }
    return new pg.Pool({ connectionString: config.DATABASE_URL });
}
