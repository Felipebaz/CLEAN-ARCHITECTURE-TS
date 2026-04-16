/**
 * Runner de migraciones — ejecuta todos los .sql de ./migrations en orden.
 * Uso: npx tsx sciprts/migrate.ts
 * Requiere: DATABASE_URL en el entorno
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function migrate() {
    const client = await pool.connect();
    try {
        // Tabla de control: registra qué migraciones ya se ejecutaron
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename   TEXT        PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        const { rows } = await client.query<{ filename: string }>(
            'SELECT filename FROM schema_migrations',
        );
        const applied = new Set(rows.map(r => r.filename));

        const files = (await readdir(MIGRATIONS_DIR))
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`  skip  ${file}`);
                continue;
            }

            const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file],
                );
                await client.query('COMMIT');
                console.log(`  apply ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
        }

        console.log('migrations complete');
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
