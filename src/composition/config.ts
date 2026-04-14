import { z } from 'zod';

export const Config = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url().optional(),
    PRICING_BASE_URL: z.string().url().default('http://localhost:3000'),
    USE_IN_MEMORY_DB: z.enum(['true', 'false']).default('true'),
    PORT: z.string().default('3000'),
});

export type Config = z.infer<typeof Config>;

export function loadConfig(env = process.env): Config {
    const parsed = Config.safeParse(env);
    if (!parsed.success) {
        console.error('Invalid environment configuration:', parsed.error);
        process.exit(1);
    }
    return parsed.data;
}