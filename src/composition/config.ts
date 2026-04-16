import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

// ─── .env parser ────────────────────────────────────────────────────────────

/** Lee KEY = VALUE, ignora comentarios y líneas vacías. */
function parseEnvFile(path: string): Record<string, string> {
    try {
        const lines = readFileSync(path, 'utf8').split('\n');
        const out: Record<string, string> = {};
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key   = trimmed.slice(0, eq).trim();
            const value = trimmed.slice(eq + 1).trim().replace(/;+$/, ''); // quita ; finales
            out[key] = value;
        }
        return out;
    } catch {
        return {}; // .env es opcional
    }
}

// ─── schema ──────────────────────────────────────────────────────────────────

const configSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),

    PORT: z.coerce
        .number({ invalid_type_error: 'PORT debe ser un número' })
        .int()
        .min(1)
        .max(65535)
        .default(3000),

    DATABASE_URL: z.string().url().optional(),

    PRICING_BASE_URL: z
        .string()
        .url()
        .default('http://localhost:4000'),

    USE_IN_MEMORY: z
        .enum(['true', 'false'])
        .transform(v => v === 'true')
        .default('true'),
});

// ─── tipos exportados ────────────────────────────────────────────────────────

export type Config = z.infer<typeof configSchema>;

// ─── loader ──────────────────────────────────────────────────────────────────

/**
 * Lee el fichero .env, lo fusiona con process.env (process.env tiene precedencia)
 * y valida el resultado con Zod. Termina el proceso con un mensaje claro si
 * alguna variable obligatoria falta o tiene formato incorrecto.
 */
export function loadConfig(envPath = resolve('.env')): Config {
    const merged = { ...parseEnvFile(envPath), ...process.env };

    const result = configSchema.safeParse(merged);

    if (!result.success) {
        const lines = result.error.issues.map(
            i => `  ${i.path.join('.') || 'root'}: ${i.message}`,
        );
        console.error(`[config] Variables de entorno inválidas:\n${lines.join('\n')}`);
        process.exit(1);
    }

    return result.data;
}
